const UserController = require('../controller/UserController');
const HistoryController = require('../controller/HistoryController');
const PaymentAndroidController = require('../controller/PaymentsAndroidController');
const routes = require('express').Router();

routes.post('/login', UserController.login);
routes.post('/register', UserController.createUser);

routes.post('/create-history', HistoryController.createHistory);
routes.delete('/delete-history/:id', HistoryController.deleteHistory);
routes.put('/update-history/:id', HistoryController.updateHistory);
routes.get('/history/:id', HistoryController.getHistoryById);
routes.get('/histories', HistoryController.getAllHistories);

routes.post('/create-payment', PaymentAndroidController.CreateAPayment);
routes.post('/payment/confirm', PaymentAndroidController.confirmPayment);
routes.post('/payment/status', PaymentAndroidController.receivePaymentStatus);

module.exports = routes;