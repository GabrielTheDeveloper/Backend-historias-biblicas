const mongoose = require('mongoose');

const connnectToDB = async () => { mongoose.connect(process.env.MONGODB_URI||"mongodb://localhost:27017/Biblia", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected successfully');
}).catch(err => {
    console.error('MongoDB connection error:', err);
})};

module.exports = connnectToDB;