const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    feedback: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
