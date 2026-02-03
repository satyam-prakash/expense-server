
const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {OAuth2Client} = require('google-auth-library');
const emailService = require('../services/emailServices');
const { validationResult } = require('express-validator');
const authController = {
  login: async (request, response) => {
    try {
      // Check validation results
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        return response.status(400).json({
          message: "Validation failed",
          errors: errors.array()
        });
      }
      
      const {email, password} = request.body;
      
      const user = await userDao.findByEmail(email);
      
      if (!user) {
        return response.status(400).json({
          message: "Invalid email or password",
        });
      }
      
      if (user.googleId && !user.password) {
        return response.status(400).json({
          message: "Please log in using Google SSO",
        });
      }
      
      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if (isPasswordMatch){
        const token = jwt.sign({
          name: user.name,
          email: user.email,
          id: user._id
        }, process.env.JWT_SECRET, {
          expiresIn: '1h'
        });
        response.cookie('jwtToken',token,{
          httpOnly: true,
          secure: false,
          domain: 'localhost',
          path: '/'
        });
        return response.status(200).json({
          message: "Successfully logged in!",
          user: user
        });
      }
      else{
        return response.status(400).json({
          message: "Invalid email or password",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      return response.status(500).json({
        message: "An error occurred during login",
      });
    }
  },
  register:async (request, response) => {
    // Check validation results
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({
        message: "Validation failed",
        errors: errors.array()
      });
    }
    
    const {name, email, password } = request.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    userDao.create({
      name : name,
      email: email,
      password: hashedPassword
    }).then(u => {
      return response.status(200).json({
        message: 'User registered successfully',
        user: {id: u._id}
      });      
    })
    .catch (error => {
      if (error.code === 'USER_EXISTS'){
        return response.status(400).json({
          message: 'User with this email already exists'
        });
      }else{
        return response.status(500).json({
          message: 'Registration failed',
        });
      }
    });
  },
isUserLoggedIn: async (request, response) => {
    try {
      const token = request.cookies?.jwtToken;

      if (!token) {
        return response.status(401).json({
          message: "Unauthorized access",
        });
      }

      jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
          return response.status(401).json({
            message: "Invalid token",
          });
        } else {
          response.json({
            user: user,
          });
        }
      });
    } catch (error) {
      console.log(error);
      return response.status(500).json({
        message: "Internal server error",
      });
    }
  },

  logout: async (request, response) => {
    try {
      response.clearCookie("jwtToken");
      response.json({ message: "Logout successfull" });
    } catch (error) {
      console.log(error);
      return response.status(500).json({
        message: "Internal server error",
      });
    }
  },
  googleSso: async (request,response) =>{
  try{
    // Check validation results
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({
        message: "Validation failed",
        errors: errors.array()
      });
    }
    
    const {idToken} = request.body;
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const googleResponse = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = googleResponse.getPayload();
    const {sub:googleId,name,email} = payload;
    let user = await userDao.findByEmail(email);
    if(!user){
      user = await userDao.create({
        name: name,
        email: email,
        googleId: googleId
      });
    }
    const token = jwt.sign({
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      id: user._id
    },process.env.JWT_SECRET,{expiresIn:'1h'});

    response.cookie('jwtToken',token,{
          httpOnly: true,
          secure: false,
          domain: 'localhost',
          path: '/'
        });
        return response.status(200).json({
          message: "UserAuthenticated",
          user: user
        });
  }
  catch(error){
    console.log(error);
    return response.status(500).json({
      message: "Internal server error"
    });
  }
},
  resetPassword: async (request, response) => {
    try {
      // Check validation results
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        return response.status(400).json({
          message: "Validation failed",
          errors: errors.array()
        });
      }
      
      const {email} = request.body;
      
      const user = await userDao.findByEmail(email);
      
      if (!user) {
        return response.status(404).json({
          message: "User not found"
        });
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await userDao.updateOtp(email, otp, otpExpiry);
      const subject = "Password Reset OTP";
      const body = `Your OTP for password reset is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`;
      
      await emailService.send(email, subject, body);
      
      return response.status(200).json({
        message: "OTP sent to your email"
      });
      
    } catch (error) {
      console.error('Reset Password Error:', error);
      console.error('Error details:', error.message, error.stack);
      return response.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  },
  
  verifyOtpAndResetPassword: async (request, response) => {
    try {
      // Check validation results
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        return response.status(400).json({
          message: "Validation failed",
          errors: errors.array()
        });
      }
      
      const { email, otp, newPassword } = request.body;
      
      const user = await userDao.findByEmail(email);
      
      if (!user) {
        return response.status(404).json({
          message: "User not found"
        });
      }
      
      if (!user.otp || !user.otpExpiry) {
        return response.status(400).json({
          message: "No OTP request found. Please request a new OTP"
        });
      }
      
      if (new Date() > user.otpExpiry) {
        return response.status(400).json({
          message: "OTP has expired. Please request a new OTP"
        });
      }
      
      if (user.otp !== otp) {
        return response.status(400).json({
          message: "Invalid OTP"
        });
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      await userDao.updatePassword(email, hashedPassword);
      
      return response.status(200).json({
        message: "Password reset successfully. Redirecting to login..."
      });
      
    } catch (error) {
      console.error('Verify OTP Error:', error);
      console.error('Error details:', error.message, error.stack);
      return response.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  }
};

module.exports = authController;
