class PaymentsControllerAndroid {
    static async CreateAPayment(req, res) {
        const data = req.body;

        res.send({
            message: 'Payment created successfully',
            data: data
        });
    }

}

module.exports = PaymentsControllerAndroid;