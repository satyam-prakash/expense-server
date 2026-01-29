const groupDao = require('../dao/groupdao');

const groupController = {
    create: async (request, response) => {
        try{
            const user = request.user;
            const {name, description, membersEmail, thumbnail} = request.body;
            let allMembers = [user.email];
            if (membersEmail && Array.isArray(membersEmail)){
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
                    currency: 'INR', 
                    date: Date.now(), 
                    isPaid: false
                }
            });
            response.status(200).json({
                message: 'Group created',
                groupId: newGroup._id
            });
        }catch(error){
            console.log(error);
            return response.status(500).json({
                message: 'Internal Server Error'
            });
        }
    },
    updateGroup: async (request, response) => {
        try{
            const {groupId, name, description, thumbnail, adminEmail, paymentStatus} = request.body;
            const updatedGroup = await groupDao.updateGroup({
                groupId, name, description, thumbnail, adminEmail, paymentStatus
            });
            response.status(200).json({
                message: 'Group updated',
                group: updatedGroup
            });
        }catch(error){
            console.log(error);
            return response.status(500).json({
                message: 'Internal Server Error'
            });
        }
    },
    addMembers: async (request, response) => {
        try{
            const {groupId, membersEmail} = request.body;
        }catch(error){
            console.log(error);
            return response.status(500).json({
                message: 'Internal Server Error'
            });
        }
    },
    removeMembers: async (request, response) => {
        try{
            const {groupId, membersEmail} = request.body;
            
        }catch(error){
            console.log(error);
            return response.status(500).json({
                message: 'Internal Server Error'
            });
        }
    },
    getGroupsByEmail: async (request, response) => {
        try{
            const {email} = request.params;
            const groups =  await groupDao.getGroupByEmails(email);
            response.status(200).json({
                message: 'Groups fetched',
                groups
            });
        }catch(error){
            console.log(error);
            return response.status(500).json({
                message: 'Internal Server Error'
            });
        }
    },
};
module.exports = groupController;