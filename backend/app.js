//Imports
const express = require('express');
const app = express();
const cors = require('cors');
const {isTeacher} = require('./auth');
//Utility Imports
const {
    User,
    hashPassword,
    verifyPassword,
    getUserByUsername,
} = require('./user');

const {
  Classroom,
} = require('./classroom');
const { configureMiddleware } = require('./middleware'); 

//Router Imports
const { authRouter } = require('./routes/authRoute');
const { dashRouter } = require('./routes/dashRoute');
const { classRouter, isAuthenticated } = require('./routes/classRoute');
//Starts middleware
configureMiddleware(app);
const test = false;
const front = test? "http://localhost:3000" : "https://athuga.com";
//Routes
app.get("/", (req, res) => {
 
  return res.send("App is Working");

});
app.use(authRouter);
app.use(dashRouter);
app.use('/class', classRouter);

//Server start

//Delete classroom
app.post('/classrooms', async (req, res) => {
  try {
    const { username, perNum, perClass } = req.body;
    // Check if the user with the given username already exists
    const deletedClassroom = await Classroom.findOneAndRemove({ username });
    const classroom = new Classroom({ username: username, className: perClass, period: perNum });
    await classroom.save();
    if(deletedClassroom){ 
      wss.clients.forEach((client) => {
        const classroomId = username+ deletedClassroom.period;
        if (client.readyState === WebSocket.OPEN  && (client.classroomId === classroomId || client.classroomId==='Admin')) {
            client.send(JSON.stringify({  action: 'navigateToHome' }));
        }
    });
      return res.status(201).json("Deleted classroom");}
    else{
      wss.clients.forEach((client) => {
        const classroomId = username+perNum;
        if (client.readyState === WebSocket.OPEN  && (client.classroomId === classroomId || client.classroomId==='Admin')) {
            client.send(JSON.stringify({  action: 'navigateToHome' }));
        }
    });
    return res.status(201).json(classroom.toObject());
    } 
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

  //Delete Classroom
app.delete('/classrooms/:username', async (req, res) => {
    const username = req.params.username;
  
    try {
      // Use Mongoose to find the classroom by its ID and remove it
      const deletedClassroom = await Classroom.findOneAndRemove({ username });
  
      if (!deletedClassroom) {
        return res.status(404).json({ error: 'Classroom not found' });
      }
        wss.clients.forEach((client) => {
          const classroomId = username+ deletedClassroom.period;
          if (client.readyState === WebSocket.OPEN  && (client.classroomId === classroomId || client.classroomId==='Admin')) {
              client.send(JSON.stringify({  action: 'navigateToHome' }));
          }
      });
      return res.status(200).json({ message: 'Classroom deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
});


  //Admin
//Find classroom and period
app.post('/all-class/:username/', async (req, res) => {
  try {
    if (req.params.username !== "Admin") {
      return res.status(403).json({ error: 'Not Admin' });
    }
    const { periods } = req.body;
    const username = req.params.username;
    const user = await User.findOne({ username});
    if (JSON.stringify(periods) !== JSON.stringify(user.periods)) {
      return res.status(403).json({ error: 'Not Admin' });
    }
    const classrooms = await Classroom.find({}, 'username').lean();
    const usernames = classrooms.map(classroom => classroom.username);
    return res.status(200).json({ usernames: usernames });

  } catch (error) {
    console.error(error);
    return res.status(403).json({ error: 'Internal server error' });
  }
});

const port = process.env.PORT || 8080;
app.use(cors({
  origin: 'https://athuga.com', // Replace with the actual origin of your frontend application
  methods: 'OPTIONS, GET, POST, DELETE',
  allowedHeaders: '*', // Make sure to replace this with the actual allowed headers
  credentials: true,
}));

//Server && Socket.io
const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require('url');
const WebSocket = require('ws');

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });
const { v4: uuidv4 } = require('uuid');

wss.on('connection', (ws, upgradeUrl) => {
  ws.id = uuidv4();
  const urlParams = new URLSearchParams(upgradeUrl.split("?")[1]);
  const sessionId = urlParams.get("sessionId");
  const classroomId = urlParams.get("classroomId");
  ws.classroomId = classroomId;
  ws.name = sessionId;
  console.log("Current WebSocket ID: ", ws.id);
  console.log("Current Classroom ID: ", ws.classroomId);
  console.log("Current Name: ", ws.name);
  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    const { action, classroomId, name, request } = data;
    try {
        // Implement your logic to update the lists here
        if (action === 'add-to-inside') {

            const { teacherUsername, period } = extractTeacherData(classroomId);
            const classroom = await Classroom.findOne({ username: teacherUsername, period });
            if(!(classroom.studentsInside.includes(name)||classroom.studentsOutside.includes(name)||classroom.studentsWaiting.includes(name))){
              classroom.studentsInside.push(name);
              // Any other necessary operations
              await classroom.save();
            } else {
              
            }

            // Broadcast the updated lists to all connected clients
            wss.clients.forEach((client) => {
             
                if (client.readyState === WebSocket.OPEN && client.classroomId === classroomId) {
                
                    client.send(JSON.stringify({ action, classroomId }));
                }
            });
        } else if (action === 'move-to-waiting') {
            // Handle the removal from the waiting list
          
            const queue = searchQueueById(classroomId);
            if(queue===null){
              manageNewQueue(classroomId);
              const curQueue = searchQueueById(classroomId);
              curQueue.enqueue(name);
            }else{
              queue.enqueue(name);
            }

            wss.clients.forEach((client) => {
            
                if (client.readyState === WebSocket.OPEN && client.classroomId === classroomId) {
                    client.send(JSON.stringify({ action, classroomId }));
                }
            });
        }
        // Handle other actions accordingly
        else if (action === 'move-to-inside') {
        

            const { teacherUsername, period } = extractTeacherData(classroomId);
            const classroom = await Classroom.findOne({ username: teacherUsername, period });
            if(!classroom.studentsInside.includes(name) && (classroom.studentsOutside.includes(name))){
              classroom.studentsInside.push(name);
              classroom.studentsWaiting = classroom.studentsWaiting.filter(studentId => studentId !== name);
              classroom.studentsOutside = classroom.studentsOutside.filter(studentId => studentId !== name);
              // Any other necessary operations
              await classroom.save();
            } else if(!classroom.studentsInside.includes(name) && (classroom.studentsWaiting.includes(name))){
              const queue = searchQueueById(classroomId);
                if(queue===null){
                  manageNewQueue(classroomId);
                  classroom.studentsInside.push(name);
                  classroom.studentsWaiting = classroom.studentsWaiting.filter(studentId => studentId !== name);
                }else{
                  queue.manualDequeue(name);
                }
              await classroom.save();
            } else {
            
            }
            // Perform the necessary updates
            // ...

            // Broadcast the updated lists to all connected clients
            wss.clients.forEach((client) => {
             
                if (client.readyState === WebSocket.OPEN  && client.classroomId === classroomId) {
                    client.send(JSON.stringify({ action, classroomId }));
                }
            });
        } else if (action === 'move-to-outside') {
           

            const { teacherUsername, period } = extractTeacherData(classroomId);
            const classroom = await Classroom.findOne({ username: teacherUsername, period });
            if(!classroom.studentsOutside.includes(name)){
              classroom.studentsOutside.push(name);
              classroom.studentsWaiting = classroom.studentsWaiting.filter(studentId => studentId !== name);
              classroom.studentsInside = classroom.studentsInside.filter(studentId => studentId !== name);
              // Any other necessary operations
              await classroom.save();
            } else {
             
            }
            // Perform the necessary updates
            // ...

            // Broadcast the updated lists to all connected clients
            wss.clients.forEach((client) => {
          
                if (client.readyState === WebSocket.OPEN  && client.classroomId === classroomId) {
                    client.send(JSON.stringify({ action, classroomId }));
                }
            });
        } else if (action === 'handle-student-request') {
            
            const { teacherUsername, period } = extractTeacherData(classroomId);
            const classroom = await Classroom.findOne({ username: teacherUsername, period });
            classroom.requests.push({ studentId: name, request });
            await classroom.save();
            // Handle the student request
            // ...

            // Broadcast the updated lists to all connected clients
            wss.clients.forEach((client) => {
            
                if (client.readyState === WebSocket.OPEN  && client.classroomId === classroomId) {
                    client.send(JSON.stringify({ action, classroomId, request }));
                }
            });
        }else if (action === 'cancel') {
          
         
          const queue = searchQueueById(classroomId);
            if(queue!==null){
              queue.removeFromQueue(name);
            }

          

          // Broadcast the updated lists to all connected clients
          wss.clients.forEach((client) => {
           
              if (client.readyState === WebSocket.OPEN  && client.classroomId === classroomId) {
                  client.send(JSON.stringify({ action, classroomId, request }));
              }
          });
      }else if (action === 'kick') {
        

        const { teacherUsername, period } = extractTeacherData(classroomId);
        const classroom = await Classroom.findOne({ username: teacherUsername, period });
        if((classroom.studentsOutside.includes(name))){
          classroom.studentsOutside = classroom.studentsOutside.filter(studentId => studentId !== name);
          // Any other necessary operations
          await classroom.save();
        } else if((classroom.studentsWaiting.includes(name))){
          const queue = searchQueueById(classroomId);
            if(queue===null){
              classroom.studentsWaiting = classroom.studentsWaiting.filter(studentId => studentId !== name);
            }else{
              queue.manualDequeue(name);
              classroom.studentsWaiting = classroom.studentsWaiting.filter(studentId => studentId !== name);
            }
          await classroom.save();
        } else if((classroom.studentsInside.includes(name))){
          classroom.studentsInside = classroom.studentsInside.filter(studentId => studentId !== name);
          await classroom.save();
        } else {
          console.log("Couldn't find student");
        }
        

        // Broadcast the updated lists to all connected clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN  && client.classroomId === classroomId) {

                client.send(JSON.stringify({ action, name, request }));
            }
        });
    }else if (action === 'send') {
      const classroom = await Classroom.findOne({ username: name });
      classroom.studentsRequests.push(request);
     await classroom.save();
      if(classroom){
              // Broadcast the updated lists to all connected clients
             
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN  &&(client.classroomId === (classroom.username+classroom.period) || client.classroomId === client.name)) {
                  client.send(JSON.stringify({ action: "success", classroomId, request }));
              }
          });

      }else{

      // Broadcast the updated lists to all connected clients
      wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN  && (client.classroomId === (classroom.username+classroom.period) || client.classroomId === client.name)) {
              client.send(JSON.stringify({ action: "fail", classroomId, request }));
          }
      });}
  }
    } catch (error) {
        console.error('Error occurred:', error);
    }
});

function extractTeacherData(classroomId) {
    const teacherUsername = classroomId.substring(0, classroomId.length - 1);
    const period = classroomId.substring(classroomId.length - 1);
    return { teacherUsername, period };
}


  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
// Handle WebSocket upgrade manually
server.on('upgrade', function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;
  const upgradeUrl = request.url;
 
  if (pathname === '/ws') {
    
    try {
      wss.handleUpgrade(request, socket, head, function done(ws) {
    
        wss.emit('connection', ws, upgradeUrl);
      });
    } catch (error) {
      
      socket.write(error + ' HTTP/1.1 400 Baad Request\r\n\r\n');
      socket.destroy();
    }
  }
});
server.listen(port, () => {
  console.log('HTTP server is listening on port ' + port);
});
//Proxy sever logic for queue
const QueueManager = require('./QueueManager');
const queueById = {};
const manageNewQueue = async (classroomId) => {
  // Your asynchronous function logic here
  console.log('Queue is populated');
  if (!queueById[classroomId]) {
    queueById[classroomId] = new QueueManager(classroomId, wss);
  }
};
const searchQueueById = (classroomId) => {
  if (queueById[classroomId]) {
    return queueById[classroomId];
  } else {
    console.log(`Queue with classroom ID ${classroomId} not found.`);
    return null;
    // You might want to handle this case based on your application's requirements
  }
};







