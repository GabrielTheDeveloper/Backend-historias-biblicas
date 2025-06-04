class PaymentsControllerAndroid {
    static async CreateAPayment(req, res) {
        const { paymentMethodData, transactionInfo } = req.body;

        res.send({
            message: 'Payment created successfully',
            data: data
        });
    }

}

module.exports = PaymentsControllerAndroid;