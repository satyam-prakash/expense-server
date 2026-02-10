const expenseDao = require('../dao/expenseDao');
const groupDao = require('../dao/groupdao');
const { validationResult } = require('express-validator');

const expenseController = {
    // Create a new expense
    create: async (request, response) => {
        try {
            console.log('Create expense request body:', JSON.stringify(request.body, null, 2));
            console.log('User from JWT:', request.user);

            // Check validation results
            const errors = validationResult(request);
            if (!errors.isEmpty()) {
                console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
                return response.status(400).json({
                    message: "Validation failed",
                    errors: errors.array()
                });
            }

            const user = request.user;
            const { title, description, amount, currency, category, groupId, splitType, splitDetails, date, attachments } = request.body;

            // Verify group exists and user is a member
            const group = await groupDao.getGroupById(groupId);
            if (!group) {
                return response.status(404).json({
                    message: "Group not found"
                });
            }

            // Check if user is either a member or the admin of the group
            const isAdmin = group.adminEmail === user.email;
            const isMember = group.membersEmail.includes(user.email);

            if (!isMember && !isAdmin) {
                return response.status(403).json({
                    message: "You are not a member of this group"
                });
            }

            // Calculate split amounts if equal split
            let calculatedSplitDetails = splitDetails;
            if (splitType === 'equal' && splitDetails) {
                const splitAmount = amount / splitDetails.length;
                calculatedSplitDetails = splitDetails.map(split => ({
                    ...split,
                    amount: parseFloat(splitAmount.toFixed(2))
                }));
            }

            const expenseData = {
                title,
                description,
                amount,
                currency: currency || 'INR',
                category,
                groupId,
                paidBy: {
                    email: user.email,
                    name: user.name
                },
                splitType,
                splitDetails: calculatedSplitDetails,
                date: date || Date.now(),
                attachments,
                createdBy: user.email
            };

            const newExpense = await expenseDao.createExpense(expenseData);

            response.status(201).json({
                message: "Expense created successfully",
                expense: newExpense
            });
        } catch (error) {
            console.error('Create expense error:', error);
            response.status(500).json({
                message: "Internal server error",
                error: error.message
            });
        }
    },

    // Get expense by ID
    getById: async (request, response) => {
        try {
            const { expenseId } = request.params;
            const expense = await expenseDao.getExpenseById(expenseId);

            if (!expense) {
                return response.status(404).json({
                    message: "Expense not found"
                });
            }

            response.status(200).json(expense);
        } catch (error) {
            console.error('Get expense error:', error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    },

    // Get all expenses for a group
    getByGroup: async (request, response) => {
        try {
            const { groupId } = request.params;
            const user = request.user;

            // Verify user is a member of the group
            const group = await groupDao.getGroupById(groupId);
            if (!group) {
                return response.status(404).json({
                    message: "Group not found"
                });
            }

            // Check if user is either a member or the admin of the group
            if (!group.membersEmail.includes(user.email) && group.adminEmail !== user.email) {
                return response.status(403).json({
                    message: "You are not a member of this group"
                });
            }

            const expenses = await expenseDao.getExpensesByGroup(groupId);
            response.status(200).json(expenses);
        } catch (error) {
            console.error('Get group expenses error:', error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    },

    // Get all expenses for logged-in user
    getMyExpenses: async (request, response) => {
        try {
            const user = request.user;
            const expenses = await expenseDao.getExpensesByUser(user.email);
            response.status(200).json(expenses);
        } catch (error) {
            console.error('Get user expenses error:', error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    },

    // Get expenses by category
    getByCategory: async (request, response) => {
        try {
            const { groupId, category } = request.params;
            const expenses = await expenseDao.getExpensesByCategory(groupId, category);
            response.status(200).json(expenses);
        } catch (error) {
            console.error('Get category expenses error:', error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    },

    // Get expenses by date range
    getByDateRange: async (request, response) => {
        try {
            const { groupId } = request.params;
            const { startDate, endDate } = request.query;

            if (!startDate || !endDate) {
                return response.status(400).json({
                    message: "Start date and end date are required"
                });
            }

            const expenses = await expenseDao.getExpensesByDateRange(groupId, startDate, endDate);
            response.status(200).json(expenses);
        } catch (error) {
            console.error('Get date range expenses error:', error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    },

    // Update expense
    update: async (request, response) => {
        try {
            const errors = validationResult(request);
            if (!errors.isEmpty()) {
                return response.status(400).json({
                    message: "Validation failed",
                    errors: errors.array()
                });
            }

            const { expenseId } = request.params;
            const user = request.user;
            const updateData = request.body;

            // Check if expense exists
            const expense = await expenseDao.getExpenseById(expenseId);
            if (!expense) {
                return response.status(404).json({
                    message: "Expense not found"
                });
            }

            // Only creator or admin can update
            if (expense.createdBy !== user.email) {
                const group = await groupDao.getGroupById(expense.groupId);
                if (group.adminEmail !== user.email) {
                    return response.status(403).json({
                        message: "You don't have permission to update this expense"
                    });
                }
            }

            const updatedExpense = await expenseDao.updateExpense(expenseId, updateData);
            response.status(200).json({
                message: "Expense updated successfully",
                expense: updatedExpense
            });
        } catch (error) {
            console.error('Update expense error:', error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    },

    // Delete expense
    delete: async (request, response) => {
        try {
            const { expenseId } = request.params;
            const user = request.user;

            // Check if expense exists
            const expense = await expenseDao.getExpenseById(expenseId);
            if (!expense) {
                return response.status(404).json({
                    message: "Expense not found"
                });
            }

            // Only creator or admin can delete
            if (expense.createdBy !== user.email) {
                const group = await groupDao.getGroupById(expense.groupId);
                if (group.adminEmail !== user.email) {
                    return response.status(403).json({
                        message: "You don't have permission to delete this expense"
                    });
                }
            }

            await expenseDao.deleteExpense(expenseId);
            response.status(200).json({
                message: "Expense deleted successfully"
            });
        } catch (error) {
            console.error('Delete expense error:', error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    },

    // Mark split as paid
    markAsPaid: async (request, response) => {
        try {
            const { expenseId } = request.params;
            const user = request.user;

            const updatedExpense = await expenseDao.markSplitAsPaid(expenseId, user.email);

            if (!updatedExpense) {
                return response.status(404).json({
                    message: "Expense not found or you are not part of this expense"
                });
            }

            response.status(200).json({
                message: "Marked as paid successfully",
                expense: updatedExpense
            });
        } catch (error) {
            console.error('Mark as paid error:', error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    },

    // Get balance summary
    getBalance: async (request, response) => {
        try {
            const { groupId } = request.params;
            const user = request.user;

            const balance = await expenseDao.getBalanceSummary(groupId, user.email);
            response.status(200).json(balance);
        } catch (error) {
            console.error('Get balance error:', error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    },

    // Get group statistics
    getStatistics: async (request, response) => {
        try {
            const { groupId } = request.params;
            const user = request.user;

            // Verify user is a member
            const group = await groupDao.getGroupById(groupId);
            if (!group) {
                return response.status(404).json({
                    message: "Group not found"
                });
            }

            // Check if user is either a member or the admin of the group
            if (!group.membersEmail.includes(user.email) && group.adminEmail !== user.email) {
                return response.status(403).json({
                    message: "You are not a member of this group"
                });
            }

            const statistics = await expenseDao.getGroupStatistics(groupId);
            response.status(200).json(statistics);
        } catch (error) {
            console.error('Get statistics error:', error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    }
};

module.exports = expenseController;
