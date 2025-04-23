const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chatRoomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true,
    },
    messages: [
        {
            senderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            text: {
                type: String,
                required: true,
            },
            isRead: {
                type: Boolean,
                default: false
            },
            readAt: {
                type: Date
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }
    ],
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;