const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR',
        uppercase: true
    },
    category: {
        type: String,
        enum: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Travel', 'Other'],
        default: 'Other'
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    paidBy: {
        email: {
            type: String,
            required: true
        },
        name: String
    },
    splitType: {
        type: String,
        enum: ['equal', 'exact', 'percentage'],
        default: 'equal'
    },
    splitDetails: [{
        email: {
            type: String,
            required: true
        },
        name: String,
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        percentage: Number,
        isPaid: {
            type: Boolean,
            default: false
        }
    }],
    date: {
        type: Date,
        default: Date.now
    },
    attachments: [{
        url: String,
        filename: String
    }],
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
expenseSchema.index({ groupId: 1, date: -1 });
expenseSchema.index({ 'paidBy.email': 1 });
expenseSchema.index({ 'splitDetails.email': 1 });

module.exports = mongoose.model('Expense', expenseSchema);
