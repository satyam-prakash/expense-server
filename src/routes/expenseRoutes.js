const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');
const { createExpenseValidator, updateExpenseValidator } = require('../../validators/expenseValidators');

router.use(authMiddleware.protect);
router.post('/create', createExpenseValidator, expenseController.create);
router.get('/my-expenses', expenseController.getMyExpenses);
router.get('/:expenseId', expenseController.getById);
router.get('/group/:groupId', expenseController.getByGroup);
router.get('/group/:groupId/category/:category', expenseController.getByCategory);
router.get('/group/:groupId/date-range', expenseController.getByDateRange);
router.get('/group/:groupId/balance', expenseController.getBalance);
router.get('/group/:groupId/statistics', expenseController.getStatistics);
router.put('/:expenseId', updateExpenseValidator, expenseController.update);
router.delete('/:expenseId', expenseController.delete);
router.patch('/:expenseId/mark-paid', expenseController.markAsPaid);
router.patch('/:expenseId/settle', expenseController.settleExpense);

module.exports = router;
