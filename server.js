require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectToDB = require('./src/config/Db');
const routes = require('./src/routes/routes');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', routes);

connectToDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});