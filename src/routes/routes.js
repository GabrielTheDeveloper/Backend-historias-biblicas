const UserController = require('../controller/UserController');
const HistoryController = require('../controller/HistoryController');
const routes = require('express').Router();

routes.post('/login', UserController.login);
routes.post('/register', UserController.createUser);
routes.post('/create-history', HistoryController.createHistory);
routes.delete('/delete-history/:id', HistoryController.deleteHistory);
routes.put('/update-history/:id', HistoryController.updateHistory);
routes.get('/history/:id', HistoryController.getHistoryById);
routes.get('/histories', HistoryController.getAllHistories);

module.exports = routes;
