const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  verifyOtpValidator,
  googleSsoValidator
} = require('../../validators/authValidators');

router.post('/login', loginValidator, authController.login);
router.post('/register', registerValidator, authController.register);
router.post("/is-user-logged-in", authController.isUserLoggedIn);
router.post("/logout", authController.logout);
router.post('/google-auth', googleSsoValidator, authController.googleSso);
router.post('/reset-password', resetPasswordValidator, authController.resetPassword);
router.post('/verify-otp-reset-password', verifyOtpValidator, authController.verifyOtpAndResetPassword);

module.exports = router;