const Expense = require('../model/expense');
const Group = require('../model/group');
const mongoose = require('mongoose');

const expenseDao = {
    // Create a new expense
    createExpense: async (expenseData) => {
        try {
            const expense = new Expense(expenseData);
            return await expense.save();
        } catch (error) {
            throw error;
        }
    },

    // Get expense by ID
    getExpenseById: async (expenseId) => {
        try {
            return await Expense.findById(expenseId).populate('groupId', 'name membersEmail');
        } catch (error) {
            throw error;
        }
    },

    // Get all expenses for a group
    getExpensesByGroup: async (groupId) => {
        try {
            return await Expense.find({ groupId }).sort({ date: -1 });
        } catch (error) {
            throw error;
        }
    },

    // Get expenses by user email (where user is involved)
    getExpensesByUser: async (email) => {
        try {
            return await Expense.find({
                $or: [
                    { 'paidBy.email': email },
                    { 'splitDetails.email': email }
                ]
            }).populate('groupId', 'name').sort({ date: -1 });
        } catch (error) {
            throw error;
        }
    },

    // Get expenses by category
    getExpensesByCategory: async (groupId, category) => {
        try {
            return await Expense.find({ groupId, category }).sort({ date: -1 });
        } catch (error) {
            throw error;
        }
    },

    // Get expenses by date range
    getExpensesByDateRange: async (groupId, startDate, endDate) => {
        try {
            return await Expense.find({
                groupId,
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }).sort({ date: -1 });
        } catch (error) {
            throw error;
        }
    },

    // Update expense
    updateExpense: async (expenseId, updateData) => {
        try {
            updateData.updatedAt = Date.now();
            return await Expense.findByIdAndUpdate(
                expenseId,
                updateData,
                { new: true, runValidators: true }
            );
        } catch (error) {
            throw error;
        }
    },

    // Delete expense
    deleteExpense: async (expenseId) => {
        try {
            return await Expense.findByIdAndDelete(expenseId);
        } catch (error) {
            throw error;
        }
    },

    // Mark split as paid
    markSplitAsPaid: async (expenseId, email) => {
        try {
            return await Expense.findOneAndUpdate(
                { _id: expenseId, 'splitDetails.email': email },
                { $set: { 'splitDetails.$.isPaid': true } },
                { new: true }
            );
        } catch (error) {
            throw error;
        }
    },

    // Get balance summary for a user in a group
    getBalanceSummary: async (groupId, email) => {
        try {
            const expenses = await Expense.find({ groupId });

            let totalPaid = 0;
            let totalOwed = 0;

            expenses.forEach(expense => {
                if (expense.paidBy.email === email) {
                    totalPaid += expense.amount;
                }

                const userSplit = expense.splitDetails.find(split => split.email === email);
                if (userSplit) {
                    totalOwed += userSplit.amount;
                }
            });

            return {
                totalPaid,
                totalOwed,
                balance: totalPaid - totalOwed
            };
        } catch (error) {
            throw error;
        }
    },

    // Get group expense statistics
    getGroupStatistics: async (groupId) => {
        try {
            const stats = await Expense.aggregate([
                { $match: { groupId: mongoose.Types.ObjectId(groupId) } },
                {
                    $group: {
                        _id: '$category',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { totalAmount: -1 } }
            ]);

            const total = await Expense.aggregate([
                { $match: { groupId: mongoose.Types.ObjectId(groupId) } },
                {
                    $group: {
                        _id: null,
                        totalExpenses: { $sum: '$amount' },
                        expenseCount: { $sum: 1 }
                    }
                }
            ]);

            return {
                categoryStats: stats,
                overall: total[0] || { totalExpenses: 0, expenseCount: 0 }
            };
        } catch (error) {
            throw error;
        }
    },

    // Get balance summary for ALL members in a group
    getGroupBalanceSummary: async (groupId) => {
        try {
            const expenses = await Expense.find({ groupId });
            const group = await Group.findById(groupId);

            if (!group) {
                throw new Error('Group not found');
            }

            // Initialize balance map for all members
            const balanceMap = {};
            group.membersEmail.forEach(email => {
                balanceMap[email] = {
                    email,
                    totalPaid: 0,
                    totalOwed: 0,
                    netBalance: 0
                };
            });

            // Calculate balances
            expenses.forEach(expense => {
                // Add to paid amount for payer
                if (balanceMap[expense.paidBy.email]) {
                    balanceMap[expense.paidBy.email].totalPaid += expense.amount;
                }

                // Add to owed amount for each person in split
                expense.splitDetails.forEach(split => {
                    if (balanceMap[split.email]) {
                        balanceMap[split.email].totalOwed += split.amount;
                    }
                });
            });

            // Calculate net balance for each member
            Object.keys(balanceMap).forEach(email => {
                balanceMap[email].netBalance =
                    balanceMap[email].totalPaid - balanceMap[email].totalOwed;
            });

            return Object.values(balanceMap);
        } catch (error) {
            throw error;
        }
    },

    // Settle group - mark all expenses as paid and group as settled
    settleGroup: async (groupId) => {
        try {
            // Mark all expenses in the group as paid
            await Expense.updateMany(
                { groupId },
                { $set: { 'splitDetails.$[].isPaid': true } }
            );

            // Mark group as settled
            const settledGroup = await Group.findByIdAndUpdate(
                groupId,
                {
                    isSettled: true,
                    settledAt: new Date()
                },
                { new: true }
            );

            return settledGroup;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = expenseDao;
