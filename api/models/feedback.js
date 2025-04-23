const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    feedback_image: {
        type: String,
        required: false, // Make it optional
    },
    status: {
        type: String,
        enum: ["pending", "in_progress", "resolved", "closed"],
        default: "pending",
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reply: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
