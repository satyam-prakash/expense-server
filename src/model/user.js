const mongoose = require('mongoose');
const { ADMIN_ROLE } = require('../utility/userRoles');

const userSchema = new mongoose.Schema({
    name: {type: String,required: true},
    email: {type: String,required: true,unique: true},
    password: {type: String,required: false},
    googleId: {type: String,required: false},
    otp: {type: String,required: false},
    otpExpiry: {type: Date,required: false},
    role: {type: String,default: ADMIN_ROLE},
    adminId: {type: mongoose.Schema.Types.ObjectId, ref: 'User',index: true}
});
module.exports = mongoose.model('User',userSchema);
