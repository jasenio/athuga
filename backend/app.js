//Imports
const express = require('express');
const app = express();
const cors = require('cors');

//Utility Imports
const {User} = require('./user');
const { Classroom } = require('./classroom');
const { configureMiddleware } = require('./middleware'); 

//Router Imports
const { authRouter } = require('./routes/authRoute');
const { dashRouter } = require('./routes/dashRoute');
const { classRouter } = require('./routes/classRoute');

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

//Extra
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

//Deletes a classroom
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
  origin: 'https://athuga.com', 
  methods: 'OPTIONS, GET, POST, DELETE',
  allowedHeaders: '*', 
  credentials: true,
}));

//Server && Websocket
const http = require('http');
const url = require('url');
const WebSocket = require('ws');

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });
const { v4: uuidv4 } = require('uuid');

//Websocket connections
wss.on('connection', (ws, upgradeUrl) => {
  ws.id = uuidv4();

  //Creates session and classroom ID
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
     // All message functions
    try {
       
        //Adds student to inside when joining class
        if (action === 'add-to-inside') {
            const { teacherUsername, period } = getTeacherData(classroomId);
            const classroom = await Classroom.findOne({ username: teacherUsername, period });

            //Checks if student isn't already inside before adding
            if(!(classroom.studentsInside.includes(name)||classroom.studentsOutside.includes(name)||classroom.studentsWaiting.includes(name))){
              classroom.studentsInside.push(name);
              await classroom.save();
            }

             // Broadcast the list
            wss.clients.forEach((client) => {
             
                if (client.readyState === WebSocket.OPEN && client.classroomId === classroomId) {
                
                    client.send(JSON.stringify({ action, classroomId }));
                }
            });
        }
        // Moves student to waiting list
        else if (action === 'move-to-waiting') {
          //Trys to find queue
            const queue = searchQueueById(classroomId);
            //Makes a new queuemanager if no queue was created
            if(queue===null){
              manageNewQueue(classroomId);
              const curQueue = searchQueueById(classroomId);
              //Adds student to queuemanager
              curQueue.enqueue(name);
            }else{
              queue.enqueue(name);
            }
            //broadcast to clients
            wss.clients.forEach((client) => {
            
                if (client.readyState === WebSocket.OPEN && client.classroomId === classroomId) {
                    client.send(JSON.stringify({ action, classroomId }));
                }
            });
        }
        //Moves student  to inside
        else if (action === 'move-to-inside') {
            const { teacherUsername, period } = getTeacherData(classroomId);
            const classroom = await Classroom.findOne({ username: teacherUsername, period });

            //Moves student from either inside or waiting list to inside
            //Check if student in outside
            if(!classroom.studentsInside.includes(name) && (classroom.studentsOutside.includes(name))){
              classroom.studentsInside.push(name);
              classroom.studentsWaiting = classroom.studentsWaiting.filter(studentId => studentId !== name);
              classroom.studentsOutside = classroom.studentsOutside.filter(studentId => studentId !== name);     
              await classroom.save();
              
              //Check if student in waiting
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
            }
             // Broadcast the list
            wss.clients.forEach((client) => {
             
                if (client.readyState === WebSocket.OPEN  && client.classroomId === classroomId) {
                    client.send(JSON.stringify({ action, classroomId }));
                }
            });
            
        } 
        //Moves student to outside
        else if (action === 'move-to-outside') {
            const { teacherUsername, period } = getTeacherData(classroomId);
            const classroom = await Classroom.findOne({ username: teacherUsername, period });

            //Filters other lists then adds student to outside
            if(!classroom.studentsOutside.includes(name)){
              classroom.studentsOutside.push(name);
              classroom.studentsWaiting = classroom.studentsWaiting.filter(studentId => studentId !== name);
              classroom.studentsInside = classroom.studentsInside.filter(studentId => studentId !== name);
              await classroom.save();
            } else {
             
            }

            // Broadcast the list
            wss.clients.forEach((client) => {
          
                if (client.readyState === WebSocket.OPEN  && client.classroomId === classroomId) {
                    client.send(JSON.stringify({ action, classroomId }));
                }
            });
      
        } 
        //Student requests
        else if (action === 'handle-student-request') {
            const { teacherUsername, period } = getTeacherData(classroomId);
            const classroom = await Classroom.findOne({ username: teacherUsername, period });

            //Adds request
            classroom.requests.push({ studentId: name, request });
            await classroom.save();

            // Broadcast the updated lists to all connected clients
            wss.clients.forEach((client) => {
            
                if (client.readyState === WebSocket.OPEN  && client.classroomId === classroomId) {
                    client.send(JSON.stringify({ action, classroomId, request }));
                }
            });
        }
        //Cancel function for students
        else if (action === 'cancel') {
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
        }
        //Kicks student out of class
        else if (action === 'kick') {
          const { teacherUsername, period } = getTeacherData(classroomId);
          const classroom = await Classroom.findOne({ username: teacherUsername, period });

          //Finds student in any list to kick out
          if((classroom.studentsOutside.includes(name))){
            classroom.studentsOutside = classroom.studentsOutside.filter(studentId => studentId !== name);
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
          
          // Broadcast the lists
          wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN  && client.classroomId === classroomId) {

                  client.send(JSON.stringify({ action, name, request }));
              }
          });
        }
        //Admin request panel
        else if (action === 'send') {
          const classroom = await Classroom.findOne({ username: name });

          //Adds request
          classroom.studentsRequests.push(request);
          await classroom.save();

          if(classroom){
                  // Broadcast to clients (request was sent)
                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN  &&(client.classroomId === (classroom.username+classroom.period) || client.classroomId === client.name)) {
                      client.send(JSON.stringify({ action: "success", classroomId, request }));
                  }
              });

          }else{

          // Broadcast to clients (request was not sent)
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

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  //Repeated function
  function getTeacherData(classroomId) {
    const teacherUsername = classroomId.substring(0, classroomId.length - 1);
    const period = classroomId.substring(classroomId.length - 1);
    return { teacherUsername, period };
  }
});

// Handle WebSocket upgrade manually for websocket traffic
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

// Starts server
server.listen(port, () => {
  console.log('HTTP server is listening on port ' + port);
});

//QueueManager for classroomss
const QueueManager = require('./QueueManager');

//List of queue managers by ID
const queueById = {};

//Creates a new queueto be used
const manageNewQueue = async (classroomId) => {
  console.log('Queue is populated');
  if (!queueById[classroomId]) {
    queueById[classroomId] = new QueueManager(classroomId, wss);
  }
};

//Searches for the queue to be used
const searchQueueById = (classroomId) => {
  if (queueById[classroomId]) {
    return queueById[classroomId];
  } else {
    console.log(`Queue with classroom ID ${classroomId} not found.`);
    return null;
  }
};







