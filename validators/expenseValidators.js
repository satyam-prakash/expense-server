const { body } = require('express-validator');

const createExpenseValidator = [
    body('title')
        .notEmpty().withMessage('Title is required')
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('groupId')
        .notEmpty().withMessage('Group ID is required')
        .isMongoId().withMessage('Invalid group ID'),
    body('category')
        .optional()
        .isIn(['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Travel', 'Other'])
        .withMessage('Invalid category'),
    body('splitType')
        .optional()
        .isIn(['equal', 'exact', 'percentage'])
        .withMessage('Split type must be equal, exact, or percentage'),
    body('splitDetails')
        .notEmpty().withMessage('Split details are required')
        .isArray({ min: 1 }).withMessage('Split details must be an array with at least one member'),
    body('splitDetails.*.email')
        .notEmpty().withMessage('Email is required in split details')
        .isEmail().withMessage('Invalid email in split details'),
    body('currency')
        .optional()
        .isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('date')
        .optional()
        .isISO8601().withMessage('Invalid date format')
];

const updateExpenseValidator = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('amount')
        .optional()
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('category')
        .optional()
        .isIn(['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Travel', 'Other'])
        .withMessage('Invalid category'),
    body('splitType')
        .optional()
        .isIn(['equal', 'exact', 'percentage'])
        .withMessage('Split type must be equal, exact, or percentage')
];

module.exports = {
    createExpenseValidator,
    updateExpenseValidator
};
