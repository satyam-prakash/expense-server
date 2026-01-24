
const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');


const authController = {
  login: async (request, response) => {
    const {email, password} = request.body;
    if (!email && !password){
      return response.status(400).json({
        message: "Please enter both email and passwor",
      });
    }
    
    const user = await userDao.findByEmail(email);
const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (user && isPasswordMatch){
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

},
  register:async (request, response) => {
    const {name, email, password } = request.body;
  
    // Return status 400 (client error) if a field it missing
    if (!name || !email || !password){
      return response.status(400).json({
        message: 'Name, Email, Password all are required.'
      });
    }
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
  }

      
};

module.exports = authController;
