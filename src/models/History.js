const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    images: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v.length > 0; // Ensure at least one image is provided
            },
            message: 'At least one image URL is required.'
        }
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    hystory: {
        type: String,
        required: true,
        trim: true
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
})


module.exports = mongoose.model('History', HistorySchema);