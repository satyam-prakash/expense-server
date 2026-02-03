const User = require('../model/user');
const userDao = {
    findByEmail: async (email) => {
        const user = await User.findOne({email});
        return user;
    },
    create: async (userData) =>{
       try{
        const newUser = new User(userData);
        return await newUser.save();
    }   catch(error){
        if (error.code === 11000) {
            const err = new Error()
            err.code = 'USER_EXISTS';
            throw err;
        }else{
            console.log(error);
            const err = new Error('Something went wrong while communicating with the DB');
            err.code = 'INTERNAL_SERVER_ERROR';
            throw err;
        }
    }
},
    updateOtp: async (email, otp, otpExpiry) => {
        const user = await User.findOneAndUpdate(
            {email},
            {otp, otpExpiry},
            {new: true}
        );
        return user;
    },
    
    updatePassword: async (email, hashedPassword) => {
        const user = await User.findOneAndUpdate(
            {email},
            {password: hashedPassword, otp: null, otpExpiry: null},
            {new: true}
        );
        return user;
    }
}

module.exports = userDao;