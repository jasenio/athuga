//Imports
const express = require('express');
const authRouter = express.Router();
const cookie = require('cookie'); // Import the 'cookie' package
const {
    User,
    hashPassword,
    verifyPassword,
    getUserByUsername,
} = require('../user');

//Register route
authRouter.get('/register', (req, res) => {
  return res.send('Register page (GET)');
  });
authRouter.post("/register", async (req, resp) => {
    try {
      const { username, password, teacher, updatedPeriods } = req.body;
      // Check if the user with the given username already exists
      const existingUser = await getUserByUsername(username);
  
      if (existingUser) {
        return resp.status(400).json({ error: 'User already exists' });
      }
  
      const hashedPassword = await hashPassword(password);
      const user = new User({ username: username, password: hashedPassword, teacher: teacher, periods: updatedPeriods});
      await user.save();
  
      const userWithoutPassword = user.toObject();
      delete userWithoutPassword.password;
      resp.status(201).json(userWithoutPassword);
    } catch (e) {
      console.error(e);
      resp.status(500).json({ error: 'Something went wrong' });
    }
  });
  
  //Login route
  authRouter.get('/login', (req, res) => {
    return res.send('Please login');
  });
  
  authRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      
  
      const user = await getUserByUsername(username);
  
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      const passwordMatch = await verifyPassword(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Incorrect password' });
      }
  
      // Password is correct, you can send the user data as a JSON response
      
      const userWithoutPassword = user.toObject();
      delete userWithoutPassword.password;
      req.session.userId = user._id.toString();
      req.session.username = user.username;
      req.session.teacher = user.teacher;
      req.session.periods = user.periods;
      //res.cookie('sessionData', JSON.stringify(req.session), {
      //  httpOnly: false, // Ensures the cookie is HTTP-onlys
       //secure: true, // Change to true if using HTTPS
       // maxAge: 24 * 60 * 60 * 1000, // Cookie expiration time in milliseconds
      // sameSite:"None",
      // path:"/",
      //  domain: "athuga.com",
     // });
      const sessionData = {
        sessionId: req.sessionID,
        cookie: cookie.serialize('connect.sid', req.sessionID, {
          domain: 'athuga.com',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'None',
        }),
        userId: req.session.userId, // Assuming 'userId' is set in the session
        Username: req.session.username, // Assuming 'username' is set in the session
        teacher: req.session.teacher, // Assuming 'teacher' is set in the session
        periods: req.session.periods, // Assuming 'periods' is set in the session
      };
    
      // Send the session data in the response
      return res.status(201).json({ sessionData: sessionData });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

module.exports = {
    authRouter,
}