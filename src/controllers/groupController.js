const groupDao = require("../dao/groupdao");
const expenseDao = require("../dao/expenseDao");

const groupController = {
    create: async (request, response) => {
        try {
            const user = request.user;
            const { name, description, membersEmail, thumbnail } = request.body;
            let allMembers = [user.email];
            if (membersEmail && Array.isArray(membersEmail)) {
                allMembers = [...new Set([...allMembers, ...membersEmail])];
            }
            const newGroup = await groupDao.createGroup({
                name,
                description,
                adminEmail: user.email,
                membersEmail: allMembers,
                thumbnail,
                paymentStatus: {
                    amount: 0,
                    currency: "INR"
                }
            });
            response.status(201).json({
                message: "Group created successfully",
                groupId: newGroup._id,
                group: newGroup
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    },

    update: async (request, response) => {
        try {
            const updatedGroup = await groupDao.updateGroup(request.body);
            if (!updatedGroup) {
                return response.status(404).json({
                    message: "Group not found"
                });
            }
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({
                message: "Error updating group"
            });
        }
    },

    addMembers: async (request, response) => {
        try {
            const { groupId, emails } = request.body;
            const updatedGroup = await groupDao.addMembers(groupId, ...emails);
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({
                message: "Error adding members"
            });
        }
    },

    removeMembers: async (request, response) => {
        try {
            const { groupId, emails } = request.body;
            const updatedGroup = await groupDao.removeMembers(groupId, ...emails);
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({
                message: "Error removing members"
            });
        }
    },

    getGroupsByUser: async (request, response) => {
        try {
            const email = request.user.email;
            console.log('Fetching groups for email:', email);
            const groups = await groupDao.getGroupByEmail(email);
            console.log('Found groups:', groups.length);
            response.status(200).json(groups);
        } catch (error) {
            console.error('Error in getGroupsByUser:', error);
            response.status(500).json({
                message: "Error fetching groups"
            });
        }
    },

    getGroupsByPaymentStatus: async (request, response) => {
        try {
            const { isPaid } = request.query;
            const status = isPaid === "true";
            const groups = await groupDao.getGroupByStatus(status);
            response.status(200).json(groups);
        } catch (error) {
            response.status(500).json({
                message: "Error filtering groups"
            });
        }
    },

    getAudit: async (request, response) => {
        try {
            const { groupId } = request.params;
            const lastSettled = await groupDao.getAuditLog(groupId);
            response.status(200).json({
                lastSettled
            });
        } catch (error) {
            response.status(500).json({
                message: "Error fetching audit log"
            });
        }
    },

    delete: async (request, response) => {
        try {
            const { groupId } = request.params;
            const deletedGroup = await groupDao.deleteGroup(groupId);
            if (!deletedGroup) {
                return response.status(404).json({
                    message: "Group not found"
                });
            }
            response.status(200).json({
                message: "Group deleted successfully",
                group: deletedGroup
            });
        } catch (error) {
            response.status(500).json({
                message: "Error deleting group"
            });
        }
    },

    getGroupById: async (request, response) => {
        try {
            const { groupId } = request.params;
            const group = await groupDao.getGroupById(groupId);

            if (!group) {
                return response.status(404).json({
                    message: "Group not found"
                });
            }

            response.status(200).json(group);
        } catch (error) {
            console.error('Get group by ID error:', error);
            response.status(500).json({
                message: "Error fetching group"
            });
        }
    },

    settleGroup: async (request, response) => {
        try {
            const { groupId } = request.params;
            const user = request.user;

            // Verify group exists and user is admin
            const group = await groupDao.getGroupById(groupId);
            if (!group) {
                return response.status(404).json({
                    message: "Group not found"
                });
            }

            if (group.adminEmail !== user.email) {
                return response.status(403).json({
                    message: "Only group admin can settle the group"
                });
            }

            // Get final balance summary before settling
            const balanceSummary = await expenseDao.getGroupBalanceSummary(groupId);

            // Settle the group
            const settledGroup = await expenseDao.settleGroup(groupId);

            response.status(200).json({
                message: "Group settled successfully",
                group: settledGroup,
                finalBalances: balanceSummary
            });
        } catch (error) {
            console.error('Settle group error:', error);
            response.status(500).json({
                message: "Error settling group"
            });
        }
    },

    getGroupBalanceSummary: async (request, response) => {
        try {
            const { groupId } = request.params;
            const user = request.user;

            // Verify group exists and user is a member
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

            const balanceSummary = await expenseDao.getGroupBalanceSummary(groupId);

            response.status(200).json({
                groupId,
                groupName: group.name,
                isSettled: group.isSettled,
                balances: balanceSummary
            });
        } catch (error) {
            console.error('Get balance summary error:', error);
            response.status(500).json({
                message: "Error fetching balance summary"
            });
        }
    }
};

module.exports = groupController;
