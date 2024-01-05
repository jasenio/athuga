//Imports
const express = require('express');
const authRouter = express.Router();
const cookie = require('cookie');
const {
    User,
    hashPassword,
    verifyPassword,
    getUserByUsername,
} = require('../user');

//Register route
authRouter.post("/register", async (req, resp) => {
    try {
      const { username, password, teacher, updatedPeriods } = req.body;

      // Checks for existing users
      const existingUser = await getUserByUsername(username);
  
      if (existingUser) {
        return resp.status(400).json({ error: 'User already exists' });
      }
  
      //Creates a hashed password and saves to the suer
      const hashedPassword = await hashPassword(password);
      const user = new User({ username: username, password: hashedPassword, teacher: teacher, periods: updatedPeriods});
      await user.save();
      
      //Returns user without password
      delete user.password;
      resp.status(201).json(user);
    } catch (e) {
      console.error(e);
      resp.status(500).json({ error: 'Something went wrong' });
    }
  });
  
//Login route
authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    //Tries to find user
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    //Verifies if the passwords match each other
    const passwordMatch = await verifyPassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
      
    req.session.userId = user._id.toString();
    req.session.username = user.username;
    req.session.teacher = user.teacher;
    req.session.periods = user.periods;
    
    //Creates sessionData cookie for verification on frontend
    const sessionData = {
      sessionId: req.sessionID,
      cookie: cookie.serialize('connect.sid', req.sessionID, {
        domain: 'athuga.com',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'None',
      }),  
      userId: req.session.userId, 
      Username: req.session.username, 
      teacher: req.session.teacher, 
      periods: req.session.periods,
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