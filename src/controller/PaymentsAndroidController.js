require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const WebSocket = require('ws');

class PaymentsControllerAndroid {
    static RN_NOTIFICATION_ENDPOINT = process.env.RN_NOTIFICATION_ENDPOINT;
    static userConnections = new Map();

    static configureWebSocket(server) {
        const wss = new WebSocket.Server({ noServer: true });
        
        server.on('upgrade', (request, socket, head) => {
            const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
            
            if (pathname === '/payments/ws') {
                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit('connection', ws, request);
                });
            } else {
                socket.destroy();
            }
        });
        
        wss.on('connection', (ws, request) => {
            const params = new URLSearchParams(request.url.split('?')[1]);
            const userId = params.get('userId');
            
            if (!userId) {
                ws.close(4001, 'UserId não fornecido');
                return;
            }
            
            PaymentsControllerAndroid.userConnections.set(userId, ws);
            
            ws.on('close', () => {
                PaymentsControllerAndroid.userConnections.delete(userId);
            });
            
            ws.on('error', (error) => {
                PaymentsControllerAndroid.userConnections.delete(userId);
            });
        });
    }

    static async sendPaymentStatusNotification(userId, paymentIntentId, status, message, success, additionalData = {}) {
        try {
            const ws = PaymentsControllerAndroid.userConnections.get(userId);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'payment_update',
                    userId,
                    paymentIntentId,
                    status,
                    message,
                    success,
                    ...additionalData
                }));
            }
            
            await axios.post(PaymentsControllerAndroid.RN_NOTIFICATION_ENDPOINT, {
                userId,
                paymentIntentId,
                status,
                message,
                success,
                ...additionalData
            });
        } catch (error) {}
    }

    static async CreateAPayment(req, res) {
        const { paymentMethodData, transactionInfo, userId } = req.body;

        if (!paymentMethodData?.tokenizationData?.token) {
            await PaymentsControllerAndroid.sendPaymentStatusNotification(
                userId,
                null,
                'invalid_request',
                'Dados de pagamento inválidos ou token ausente.',
                false
            );
            return res.status(400).json({ error: 'Dados de pagamento inválidos ou token ausente.' });
        }

        const googlePayToken = paymentMethodData.tokenizationData.token;
        const amount = parseFloat(transactionInfo.totalPrice) * 100;
        const currency = transactionInfo.currencyCode || 'BRL';
        const description = transactionInfo.displayItems?.[0]?.label || 'Compra de Curso';

        try {
            const paymentMethod = await stripe.paymentMethods.create({
                type: 'card',
                card: { token: googlePayToken },
            });

            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency,
                payment_method: paymentMethod.id,
                confirmation_method: 'manual',
                confirm: true,
                description,
                metadata: { app_userId: userId },
                return_url: 'your-app://stripe-redirect',
            });

            switch (paymentIntent.status) {
                case 'succeeded':
                    await PaymentsControllerAndroid.sendPaymentStatusNotification(
                        userId,
                        paymentIntent.id,
                        paymentIntent.status,
                        'Pagamento processado com sucesso!',
                        true,
                        { paymentIntent: JSON.stringify(paymentIntent) }
                    );
                    return res.status(200).json({
                        success: true,
                        paymentIntentId: paymentIntent.id,
                        status: paymentIntent.status,
                    });

                case 'requires_action':
                    await PaymentsControllerAndroid.sendPaymentStatusNotification(
                        userId,
                        paymentIntent.id,
                        paymentIntent.status,
                        'Pagamento requer autenticação adicional.',
                        false,
                        { clientSecret: paymentIntent.client_secret }
                    );
                    return res.status(200).json({
                        requiresAction: true,
                        clientSecret: paymentIntent.client_secret,
                        paymentIntentId: paymentIntent.id,
                    });

                default:
                    await PaymentsControllerAndroid.sendPaymentStatusNotification(
                        userId,
                        paymentIntent.id,
                        paymentIntent.status,
                        `Status de pagamento inesperado: ${paymentIntent.status}`,
                        false
                    );
                    return res.status(400).json({
                        error: `Status de pagamento inesperado: ${paymentIntent.status}`,
                        status: paymentIntent.status,
                    });
            }
        } catch (error) {
            const errorMessage = error.type === 'StripeCardError' 
                ? error.message 
                : 'Erro interno do servidor ao processar o pagamento.';

            await PaymentsControllerAndroid.sendPaymentStatusNotification(
                userId,
                error.raw?.payment_intent?.id || null,
                'failed',
                errorMessage,
                false,
                { errorDetails: error.toString() }
            );

            return res.status(500).json({
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
            });
        }
    }

    static async receivePaymentStatus(req, res) {
        const { userId, paymentIntentId, status, message, success, clientSecret } = req.body;
        res.status(200).json({ received: true });
    }

    static async confirmPayment(req, res) {
        const { paymentIntentId } = req.body;

        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            
            if (paymentIntent.status === 'succeeded') {
                await PaymentsControllerAndroid.sendPaymentStatusNotification(
                    paymentIntent.metadata.app_userId,
                    paymentIntent.id,
                    paymentIntent.status,
                    'Pagamento confirmado com sucesso!',
                    true
                );
                return res.status(200).json({ success: true });
            }

            const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId);
            
            await PaymentsControllerAndroid.sendPaymentStatusNotification(
                confirmedIntent.metadata.app_userId,
                confirmedIntent.id,
                confirmedIntent.status,
                confirmedIntent.status === 'succeeded' 
                    ? 'Pagamento confirmado com sucesso!' 
                    : 'Pagamento requer ação adicional.',
                confirmedIntent.status === 'succeeded',
                { clientSecret: confirmedIntent.client_secret }
            );

            return res.status(200).json({
                success: confirmedIntent.status === 'succeeded',
                requiresAction: confirmedIntent.status === 'requires_action',
                clientSecret: confirmedIntent.client_secret,
            });
        } catch (error) {
            return res.status(500).json({ 
                error: 'Erro ao confirmar pagamento',
                details: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
            });
        }
    }
}

module.exports = PaymentsControllerAndroid;