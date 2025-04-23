mongoose = require('mongoose');

const receivedSchema = {
    blog: {
        type: String,
        ref: 'Blog',
        required: true
    },
    receiverFirstName: {
        type: String,
        required: true
    },
    receiverLastName: {
        type: String,
        required: true
    },
    receiverPhone: {
        type: String,
        required: true
    },
    receiverContact: {
        type: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
};

const Received = mongoose.model("Received", receivedSchema);

module.exports = Received;