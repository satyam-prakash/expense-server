const rbacDao = require("../dao/rbacDao");


const rbacController = {
    create: async(request,response) => {
        try{
            
            const adminUser = request.user;
            const {name,email,role} = request.body;
            const user = await rbacDao.create(email,name,role,adminUser._id);
            return response.status(200).json({
                message: 'User created',
                user: user
            });
        }catch(error){
            console.log(error);
            response.status(500).json({message: 'Internal server error'});
        }
    },
    update: async (request,response) =>{
        try{
            const { userId, name, role } = request.body;
            const updatedUser = await rbacDao.update(userId, name, role);
            if (!updatedUser) {
                return response.status(404).json({
                    message: 'User not found'
                });
            }
            response.status(200).json({
                message: 'User updated successfully',
                user: updatedUser
            });
        } catch (error){
            console.log(error);
                response.status(500).json({message: 'Internal server erorr'});
            }
    },

    delete: async(request,response)=>{
        try{
            const { userId } = request.body;
            const deletedUser = await rbacDao.delete(userId);
            if (!deletedUser) {
                return response.status(404).json({
                    message: 'User not found'
                });
            }
            response.status(200).json({
                message: 'User deleted successfully',
                user: deletedUser
            });
        }catch(error){
            console.log(error)
            response.status(500).json({message: 'Internal server error'});
        }
    },
    getAllUsers: async(request,response) =>{
        try{
            const adminId = request.user.adminId;
            const users = await rbacDao.getUsersByAdminId(adminId);
            response.status(200).json({
                users: users
            });
        }catch(error){
            console.log(error)
            response.status(500).json({message: 'Internal server error'});
        }
    }
};
module.exports = rbacController;