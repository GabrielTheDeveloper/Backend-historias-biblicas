require('dotenv').config();
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectToDB = require('./src/config/Db');
const routes = require('./src/routes/routes');
const PaymentAndroidController = require('./src/controller/PaymentsAndroidController');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
PaymentAndroidController.configureWebSocket(server);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', routes);
connectToDB();


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});