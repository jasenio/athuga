const express = require('express');
const dashRouter = express.Router();
const { Classroom } = require('../classroom');

//Checks if user is authenticated
function isAuthenticated(req, res, next) {
  return next();
    if (req.session && req.session.userId) {
      // User is authenticated, continue to the route handler
      return next();
    } else {
      // User is not authenticated, redirect or send an error response
      req.url = '/logout';
      dashRouter.handle(req, res);
    }
}

//Find classroom and period
dashRouter.get('/classroom/:id', isAuthenticated, async (req, res) => {
  try {
    // Use Mongoose to find all classrooms created by the teacher
    const id = req.params.id;
    const classrooms = await Classroom.find({
      $and: [
        { username: id.substring(0, id.length-1) },
        { period: id.substring(id.length-1, id.length) },
      ],
    });
    // Check if classrooms were found
    if (classrooms.length === 0) {
      return res.status(404).json({ error: 'No classrooms found for '+ id });
    }

    // Return the list of classrooms
    return res.status(200).json(classrooms);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

//Find classroom
dashRouter.post('/classrooms/:teacher', isAuthenticated, async (req, res) => {
    const username = req.params.teacher;
    const { periods } = req.body;
    try {
      // Use Mongoose to find all classrooms created by the teacher
      const classrooms = await Classroom.find({ username });
      // Check if classrooms were found
      const containsVariable = periods.some(item => item.teacher === username);
      if (classrooms.length === 0 && containsVariable) {
        return res.status(404).json({ error: 'No classrooms found for the teacher' });
      }
      return res.status(200).json(classrooms);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error});
    }
});

// Logout
dashRouter.get('/logout', async (req, res) => {
  try {
    console.log("logOut");
    console.log("Session before destroy: ", req.session);

    //Try to clear the sessionData cookie
    try {
        await new Promise((resolve, reject) => {
            res.clearCookie('sessionData');
            resolve();
        });
    } catch (error) {
        console.error("Error while clearing cookie:", error);
    }

      // Send response only once
      return res.status(201).json('deleted');
  } catch (error) {
      console.error("General error:", error);
      // Handle the error appropriately
      return res.status(500).json({ error: "An error occurred." });
  }
});

module.exports = {
  dashRouter,
}