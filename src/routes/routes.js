const UserController = require('../controller/UserController');
const routes = require('express').Router();

routes.post('/login', UserController.login);
routes.post('/register', UserController.createUser);

module.exports = routes;
