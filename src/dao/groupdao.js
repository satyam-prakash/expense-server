const Group = require("../model/group");


const groupDao = {
    createGroup : async (data) => {
        const newGroup = new Group(data);
        return await newGroup.save();
    },

    updateGroup : async (data) => {
        const {name, description, thumbnail, adminEmail, paymentStatus} = data;

        return await Group.findByIdAndUpdate(groupId, {
            name, description, thumbnail, adminEmail, paymentStatus
        },{new: true});
    },

    addMembers : async (groupId, ...membersEmail) => {
        return await Group.findByIdAndUpdate(groupId,{
            $addToSet: {membersEmail: {$each: membersEmail}}
        },{new:true});
    },

    removeMembers : async (groupId, ...membersEmail) => {
        return await Group.findByIdAndUpdate(groupId,{
            $pull: {membersEmail: {$in: membersEmail}}
        },{new:true});
    },

    getGroupByEmails: async (email) =>{
        return await Group.find({membersEmail: email});
    },

    getGroupByStatus: async (status) =>{
        return await Group.find({'paymentStatus.paymentStatus': status});
    },

    getAuditLog: async (groupId) => {
        return await Group.findById(groupId).select('paymentStatus');
    }
}

module.exports = groupDao;