const express = require('express');
const dashRouter = express.Router();
const {isTeacher} = require('../auth');
const {
    Classroom,
} = require('../classroom');
const{
    User,
    getUserByUsername,
} = require('../user');

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

//Get dashboard
dashRouter.get('/dashboard', isAuthenticated, (req, res) => {
    res.set('Content-Type', 'text/plain'); // Set content type to plain text
    return res.send(`Session Ongoing`);
  });

//Find classroom and period
dashRouter.get('/classroom/:id', isAuthenticated, async (req, res) => {
  try {
    // Use Mongoose to find all classrooms created by the teacher
    const id = req.params.id;
    const classrooms = await Classroom.find({
      $and: [
        { username: id.substring(0, id.length-1) }, // Replace with the specific username you're looking for
        { period: id.substring(id.length-1, id.length) }, // Replace with the other field and value
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
      // Debug statement for session

      try {
          await new Promise((resolve, reject) => {
              req.session.destroy(err => {
                  if (err) {
                      console.error("Error destroying session:", err);
                      reject(err);
                  } else {
                     
                      resolve();
                  }
              });
          });
      } catch (error) {
          console.error("Error while destroying session:", error);
      }

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

  // This route is protected, and only authenticated users can access it
  dashRouter.get('/teacher', isTeacher, (req, res) => {
    return res.json({ message: 'Protected Route' });
  });
  module.exports = {
    dashRouter,
  }