const User = require("../model/user");

const rbacDao = {
  findByEmail: async (email) => {
    return await User.findOne({ email });
  },
  create: async (email, name, role, password, adminId) => {
    return await User.create({ email, password, name, role, adminId });
  },
  grantAccess: async (userId, adminId, role) => {
    return await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { grantedAccess: adminId },
        role: role // Update role for this access
      },
      { new: true }
    ).select("-password");
  },
  update: async (userId, name, role) => {
    return await User.findByIdAndUpdate(userId, { name, role }, { new: true });
  },
  delete: async (userId) => {
    return await User.findByIdAndDelete(userId);
  },
  getUsersByAdminId: async (adminId) => {
    // Get users where adminId matches OR where adminId is in grantedAccess array
    return await User.find({
      $or: [
        { adminId: adminId },
        { grantedAccess: adminId }
      ]
    }).select("-password");
  },
};
module.exports = rbacDao;
