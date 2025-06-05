require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

class PaymentsControllerAndroid {
    static RN_NOTIFICATION_ENDPOINT = process.env.RN_NOTIFICATION_ENDPOINT;

    static async sendPaymentStatusNotification(userId, paymentIntentId, status, message, success, additionalData = {}) {
        try {
            await axios.post(PaymentsControllerAndroid.RN_NOTIFICATION_ENDPOINT, {
                userId: userId,
                paymentIntentId: paymentIntentId,
                status: status,
                message: message,
                success: success,
                ...additionalData
            });
        } catch (error) {
            console.error('Erro ao enviar notificação de status de pagamento:', error.message);
        }
    }

    static async CreateAPayment(req, res) {
        const { paymentMethodData, transactionInfo, userId } = req.body;

        if (!paymentMethodData || !paymentMethodData.tokenizationData || !paymentMethodData.tokenizationData.token) {
            PaymentsControllerAndroid.sendPaymentStatusNotification(
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
        const currency = transactionInfo.currencyCode;
        const description = transactionInfo.displayItems && transactionInfo.displayItems.length > 0
                                ? transactionInfo.displayItems[0].label
                                : 'Compra de Curso';

        try {
            const paymentMethod = await stripe.paymentMethods.create({
                type: 'card',
                card: {
                    token: googlePayToken,
                },
            });

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: currency,
                payment_method: paymentMethod.id,
                confirmation_method: 'manual',
                confirm: true,
                description: description,
                metadata: {
                    app_userId: userId,
                },
            });

            if (paymentIntent.status === 'succeeded') {
                PaymentsControllerAndroid.sendPaymentStatusNotification(
                    userId,
                    paymentIntent.id,
                    paymentIntent.status,
                    'Pagamento processado com sucesso!',
                    true
                );
                return res.status(200).json({
                    success: true,
                    message: 'Pagamento processado com sucesso!',
                    paymentIntentId: paymentIntent.id,
                    status: paymentIntent.status,
                });
            } else if (paymentIntent.status === 'requires_action') {
                PaymentsControllerAndroid.sendPaymentStatusNotification(
                    userId,
                    paymentIntent.id,
                    paymentIntent.status,
                    'Pagamento requer autenticação adicional.',
                    false,
                    { clientSecret: paymentIntent.client_secret }
                );
                return res.status(200).json({
                    success: false,
                    message: 'Pagamento requer autenticação adicional. Redirecione o usuário.',
                    paymentIntentId: paymentIntent.id,
                    status: paymentIntent.status,
                    clientSecret: paymentIntent.client_secret,
                    requiresAction: true,
                });
            } else {
                PaymentsControllerAndroid.sendPaymentStatusNotification(
                    userId,
                    paymentIntent.id,
                    paymentIntent.status,
                    `Erro inesperado no processamento do pagamento. Status: ${paymentIntent.status}`,
                    false
                );
                return res.status(500).json({
                    success: false,
                    error: `Erro inesperado no processamento do pagamento. Status: ${paymentIntent.status}`,
                    status: paymentIntent.status,
                });
            }

        } catch (error) {
            let errorMessage = error.message || 'Erro interno do servidor ao processar o pagamento.';
            if (error.type === 'StripeCardError') {
                errorMessage = error.message;
            }

            PaymentsControllerAndroid.sendPaymentStatusNotification(
                userId,
                error.raw && error.raw.payment_intent ? error.raw.payment_intent.id : null,
                'failed',
                errorMessage,
                false
            );

            return res.status(500).json({
                success: false,
                error: errorMessage,
            });
        }
    }

    static async receivePaymentStatus(req, res) {
        const { userId, paymentIntentId, status, message, success, clientSecret } = req.body;

        console.log('--- Notificação de Status de Pagamento Recebida ---');
        console.log(`Usuário: ${userId}`);
        console.log(`PaymentIntent ID: ${paymentIntentId || 'N/A'}`);
        console.log(`Status: ${status}`);
        console.log(`Mensagem: ${message}`);
        console.log(`Sucesso: ${success}`);
        if (clientSecret) {
            console.log(`Client Secret (para 3DS): ${clientSecret}`);
        }
        console.log('--------------------------------------------------');

        res.status(200).json({ received: true, message: 'Notificação de status de pagamento processada.' });
    }
}

module.exports = PaymentsControllerAndroid;