const groupDao = require('../dao/groupdao');

const groupController = {
    create: async (request, response) => {
        try{
            const {name, description, adminEmail, membersEmail, thumbnail} = request.body;
            let allMembers = [adminEmail];
            if (membersEmail && Array.isArray(membersEmail)){
                allMembers = [...new Set([...allMembers, ...membersEmail])];
            }
            const newGroup = await groupDao.createGroup({
                name,
                description,
                adminEmail,
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
};
module.exports = groupController;