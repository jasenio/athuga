const express = require('express');
const classRouter = express.Router();
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
      res.redirect('/login');
    }
  }
//Get dashboard
classRouter.get('/classroom', isAuthenticated, (req, res) => {
    res.set('Content-Type', 'text/plain'); // Set content type to plain text
    return res.send(`Session Ongoing`);
  });
  classRouter.get('/add-to-waiting', isAuthenticated, (req, res) => {
    res.set('Content-Type', 'text/plain'); // Set content type to plain text
    return res.send(`Session Ongoing`);
  });

  classRouter.post('/add-to-waiting/:id/:username', isAuthenticated, async (req, res) => {
    console.log("check");
    const { id } = req.params;
    const teacherUsername = id.substring(0, id.length - 1);
    const period = id.substring(id.length - 1);
    const classroom = await Classroom.findOne({ username: teacherUsername, period });
    classroom.studentsWaiting.push(req.session.username);
    await classroom.save();
    return res.status(200).json({ message: 'Student added to the waiting list' });
  });
  
  // Remove student from the studentsWaiting
  classRouter.post('/remove-from-waiting/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const teacherUsername = id.substring(0, id.length - 1);
    const period = id.substring(id.length - 1);
    const classroom = await Classroom.findOne({ username: teacherUsername, period });
    classroom.studentsWaiting = classroom.studentsWaiting.filter(studentId => studentId !== req.session.username);
    await classroom.save();
    return res.status(200).json({ message: 'Student removed from the waiting list' });
  });
  
  // Move student from outside to inside
  classRouter.post('/move-to-inside/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const teacherUsername = id.substring(0, id.length - 1);
    const period = id.substring(id.length - 1);
    const classroom = await Classroom.findOne({ username: teacherUsername, period });
    classroom.studentsInside.push(req.session.username);
    classroom.studentsWaiting = classroom.studentsWaiting.filter(studentId => studentId !== req.session.username);
    await classroom.save();
    return res.status(200).json({ message: 'Student moved from waiting list to inside' });
  });
  
  // Move student from inside to outside
  classRouter.post('/move-to-outside/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const teacherUsername = id.substring(0, id.length - 1);
    const period = id.substring(id.length - 1);
    const classroom = await Classroom.findOne({ username: teacherUsername, period });
    classroom.studentsWaiting.push(req.session.username);
    classroom.studentsInside = classroom.studentsInside.filter(studentId => studentId !== req.session.username);
    await classroom.save();
    return res.status(200).json({ message: 'Student moved from inside to waiting list' });
  });
  
  // Handle specific student requests
  classRouter.post('/handle-student-request/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const teacherUsername = id.substring(0, id.length - 1);
    const period = id.substring(id.length - 1);
    const { request } = req.body;
    const classroom = await Classroom.findOne({ username: teacherUsername, period });
    classroom.requests.push({ studentId: req.session.username, request });
    // Logic to handle specific student requests
    await classroom.save();
    return res.status(200).json({ message: 'Student request handled' });
  });
   //Get lists
   classRouter.get('/lists/:id', isAuthenticated, async (req, res) => {
    try{const { id } = req.params;
    const teacherUsername = id.substring(0, id.length - 1);
    const period = id.substring(id.length - 1);
    const classroom = await Classroom.findOne({ username: teacherUsername, period });
    const { studentsInside, studentsOutside, studentsWaiting, studentsRequests } = classroom;
    
    return res.status(200).json({ 
        studentsInside: studentsInside, 
        studentsOutside: studentsOutside, 
        studentsWaiting: studentsWaiting, 
        studentsRequests: studentsRequests, 
    });}catch(error){
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  

// Logout
classRouter.get('/logout', async (req, res) => {
  try {
      console.log("logOut");
      // Debug statement for session
      console.log("Session before destroy: ", req.session);

      try {
          await new Promise((resolve, reject) => {
              req.session.destroy(err => {
                  if (err) {
                      console.error("Error destroying session:", err);
                      reject(err);
                  } else {
                      console.log("Session destroyed successfully.");
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
              console.log("Cookie cleared.");
              resolve();
          });
      } catch (error) {
          console.error("Error while clearing cookie:", error);
      }

      console.log('end');
      // Send response only once
      return res.status(201).json('deleted');
  } catch (error) {
      console.error("General error:", error);
      // Handle the error appropriately
      return res.status(500).json({ error: "An error occurred." });
  }
});
  
  module.exports = {
    classRouter,
    isAuthenticated,
  }