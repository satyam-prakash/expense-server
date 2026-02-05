const Group = require("../model/group");

const groupDao = {
    createGroup: async(data) => {
        return await Group.create(data);
    },

    updateGroup: async(data) => {
        return await Group.findByIdAndUpdate(data._id, data, {
            new: true
        });
    },

    addMembers: async(groupId, ...membersEmails) => {
        return await Group.findByIdAndUpdate(
            groupId, {
            $addToSet: {
                membersEmail: {
                    $each: membersEmails
                }
            }
        }, {
            new: true
        });
    },

    removeMembers: async(groupId, ...membersEmails) => {
        return await Group.findByIdAndUpdate(
            groupId, {
            $pull: {
                membersEmail: {
                    $in: membersEmails
                }
            }
        }, {
            new: true
        });
    },

    getGroupByEmail: async(email) => {
        return await Group.find({
            membersEmail: { $regex: new RegExp(`^${email}$`, 'i') }
        });
    },

    getGroupById: async(groupId) => {
        return await Group.findById(groupId);
    },

    getGroupByStatus: async(status) => {
        return await Group.find({
            "paymentStatus.isPaid": status
        });
    },

    getAuditLog: async(groupId) => {
        const group = await Group.findById(groupId).select("paymentStatus.date");
        return group ? group.paymentStatus.date : null;
    },

    deleteGroup: async(groupId) => {
        return await Group.findByIdAndDelete(groupId);
    }
};

module.exports = groupDao;
