
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentsControllerAndroid {
    static async CreateAPayment(req, res) {
        const { paymentMethodData, transactionInfo, userId } = req.body;

        if (!paymentMethodData || !paymentMethodData.tokenizationData || !paymentMethodData.tokenizationData.token) {
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
                return res.status(200).json({
                    success: true,
                    message: 'Pagamento processado com sucesso!',
                    paymentIntentId: paymentIntent.id,
                    status: paymentIntent.status,
                });
            } else if (paymentIntent.status === 'requires_action') {
                return res.status(200).json({
                    success: false,
                    message: 'Pagamento requer autenticação adicional. Redirecione o usuário.',
                    paymentIntentId: paymentIntent.id,
                    status: paymentIntent.status,
                    clientSecret: paymentIntent.client_secret,
                    requiresAction: true,
                });
            } else {
                return res.status(500).json({
                    success: false,
                    error: `Erro inesperado no processamento do pagamento. Status: ${paymentIntent.status}`,
                    status: paymentIntent.status,
                });
            }

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message || 'Erro interno do servidor ao processar o pagamento.',
            });
        }
    }
}

module.exports = PaymentsControllerAndroid;
