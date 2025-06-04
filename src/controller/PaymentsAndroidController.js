require('dotenv').config(); 
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 

class PaymentsControllerAndroid {
     
    static async CreateAPayment(req, res) {
        const { paymentMethodData, transactionInfo } = req.body;
        
        if (!paymentMethodData || !paymentMethodData.tokenizationData || !paymentMethodData.tokenizationData.token) {
            console.error('Dados de pagamento incompletos ou token ausente:', req.body);
            return res.status(400).json({ error: 'Dados de pagamento inválidos ou token ausente.' });
        }

        const googlePayToken = paymentMethodData.tokenizationData.token;
        
        const amount = parseFloat(transactionInfo.totalPrice) * 100;
        const currency = transactionInfo.currencyCode;
        const description = transactionInfo.displayItems && transactionInfo.displayItems.length > 0
                            ? transactionInfo.displayItems[0].label
                            : 'Compra de Curso'; // Descrição padrão

        console.log('Token do Google Pay recebido no backend:', googlePayToken);
        console.log(`Tentando cobrar: ${amount / 100} ${currency} para "${description}"`);

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
                    userId: 'user_ID_do_seu_banco', 
                    courseId: 'course_ID_do_seu_banco', 
                    
                },

            });

            
            if (paymentIntent.status === 'succeeded') {
                console.log('Pagamento Stripe bem-sucedido:', paymentIntent.id);
                

                return res.status(200).json({
                    success: true,
                    message: 'Pagamento processado com sucesso!',
                    paymentIntentId: paymentIntent.id,
                    status: paymentIntent.status,
                });
            } else if (paymentIntent.status === 'requires_action') {
                
                console.log('Pagamento requer ação adicional:', paymentIntent.id);
                return res.status(200).json({
                    success: false,
                    message: 'Pagamento requer autenticação adicional. Redirecione o usuário.',
                    paymentIntentId: paymentIntent.id,
                    status: paymentIntent.status,
                    clientSecret: paymentIntent.client_secret, 
                    requiresAction: true,
                });
            } else {
                
                console.error('Status de pagamento Stripe inesperado ou falha inicial:', paymentIntent.status);
                return res.status(500).json({
                    success: false,
                    error: `Erro inesperado no processamento do pagamento. Status: ${paymentIntent.status}`,
                    status: paymentIntent.status,
                });
            }

        } catch (error) {
            console.error('Erro ao processar pagamento com Stripe:', error);
            
            return res.status(500).json({
                success: false,
                error: error.message || 'Erro interno do servidor ao processar o pagamento.',
            });
        }
    }
}

module.exports = PaymentsControllerAndroid;
