const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    blog: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Blog"
        }
    ],
    profileImage: {
        type: String,
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
    },
    hasAcceptedPolicy: { 
        type: Boolean,
        default: false,
    },
    admin: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Admin",
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    accountStatus: {
        type: String,
        enum: ["active", "suspended"],
        default: "active"
    },
    loginCount: {
        type: Number,
        default: 0 
    },
    lastLogin: {
        type: Date, 
        default: null
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
