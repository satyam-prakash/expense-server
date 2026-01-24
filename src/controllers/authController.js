const userDao = require('../dao/userDao');
const users = require('../dao/userDb')


const authController = {
  login: async (request, response) => {
    const {email, password} = request.body;
    if (!email && !password){
      return response.status(400).json({
        message: "Please enter both email and passwor",
      });
    }

    const user = await userDao.findByEmail(email);
    if (user && user.password === password){
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
    const user = await userDao.create({
      name : name,
      email: email,
      password: password
    })
    // Return status 200 when regsitration is successfully done
    return response.status(200).json({
      message: "Successfully registered",
      user: {id: user.id} 
    });
  },

      
};

module.exports = authController;
