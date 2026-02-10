const groupDao = require('../dao/groupdao');
const expenseDao = require('../dao/expenseDao');

const userController = {
    // Get user's financial summary across all groups
    getFinancialSummary: async (request, response) => {
        try {
            const user = request.user;

            // Get all groups user is a member of
            const groups = await groupDao.getGroupByEmail(user.email);

            let totalToPay = 0;
            let totalToReceive = 0;
            const groupSummaries = [];

            // Calculate balance for each group
            for (const group of groups) {
                const expenses = await expenseDao.getExpensesByGroup(group._id);

                let groupPaid = 0;
                let groupOwed = 0;

                expenses.forEach(expense => {
                    if (expense.paidBy.email === user.email) {
                        groupPaid += expense.amount;
                    }

                    const userSplit = expense.splitDetails.find(split => split.email === user.email);
                    if (userSplit) {
                        groupOwed += userSplit.amount;
                    }
                });

                const netBalance = groupPaid - groupOwed;

                // Aggregate totals
                if (netBalance > 0) {
                    totalToReceive += netBalance;
                } else if (netBalance < 0) {
                    totalToPay += Math.abs(netBalance);
                }

                groupSummaries.push({
                    groupId: group._id,
                    groupName: group.name,
                    thumbnail: group.thumbnail,
                    netBalance: netBalance,
                    totalPaid: groupPaid,
                    totalShare: groupOwed,
                    memberCount: group.membersEmail.length,
                    isSettled: group.isSettled,
                    isAdmin: group.adminEmail === user.email
                });
            }

            response.status(200).json({
                totalToPay: parseFloat(totalToPay.toFixed(2)),
                totalToReceive: parseFloat(totalToReceive.toFixed(2)),
                netBalance: parseFloat((totalToReceive - totalToPay).toFixed(2)),
                groupCount: groups.length,
                groups: groupSummaries
            });
        } catch (error) {
            console.error('Get financial summary error:', error);
            response.status(500).json({
                message: 'Error fetching financial summary',
                error: error.message
            });
        }
    }
};

module.exports = userController;
