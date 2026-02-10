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

    // Settle a single expense - mark ALL splits as paid
    settleExpense: async (expenseId) => {
        try {
            return await Expense.findByIdAndUpdate(
                expenseId,
                { $set: { 'splitDetails.$[].isPaid': true } },
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
                // Only count paid amount if the expense is not settled (meaning at least one split is unpaid)
                // However, logic for "totalPaid" usually implies what they paid for OTHERS that hasn't been paid back.
                // Simplified: Total Paid for the group vs Total Owed to the group for UNSETTLED transactions.

                // If I paid for an expense, I am owed the amount of splits that are NOT me.
                // If I am in a split, I owe that amount unless it is paid.

                if (expense.paidBy.email === email) {
                    expense.splitDetails.forEach(split => {
                        if (split.email !== email && !split.isPaid) {
                            totalPaid += split.amount;
                        }
                    });
                }

                const userSplit = expense.splitDetails.find(split => split.email === email);
                if (userSplit && !userSplit.isPaid && expense.paidBy.email !== email) {
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

    // ... (getGroupStatistics remains unchanged) ...

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
                    totalPaid: 0, // Amount they are owed (net positive)
                    totalOwed: 0, // Amount they owe (net negative)
                    netBalance: 0
                };
            });
            // Ensure admin is in map if not in membersEmail
            if (!balanceMap[group.adminEmail]) {
                balanceMap[group.adminEmail] = {
                    email: group.adminEmail,
                    totalPaid: 0,
                    totalOwed: 0,
                    netBalance: 0
                };
            }


            // Calculate balances based on UNSETTLED transactions
            expenses.forEach(expense => {
                const payerEmail = expense.paidBy.email;

                expense.splitDetails.forEach(split => {
                    // We only care about splits that are NOT paid yet
                    if (!split.isPaid) {
                        const amount = split.amount;
                        const owerEmail = split.email;

                        // If payer and ower are different, this creates a debt relationship
                        if (payerEmail !== owerEmail) {
                            // Payer gets credit (is owed money)
                            if (balanceMap[payerEmail]) {
                                balanceMap[payerEmail].totalPaid += amount;
                            } else {
                                // Fallback if payer not in group list for some reason
                                balanceMap[payerEmail] = { email: payerEmail, totalPaid: amount, totalOwed: 0, netBalance: 0 };
                            }

                            // Ower gets debit (owes money)
                            if (balanceMap[owerEmail]) {
                                balanceMap[owerEmail].totalOwed += amount;
                            } else {
                                balanceMap[owerEmail] = { email: owerEmail, totalPaid: 0, totalOwed: amount, netBalance: 0 };
                            }
                        }
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
