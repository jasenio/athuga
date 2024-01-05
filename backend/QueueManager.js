const {
    Classroom,
  } = require('./classroom');
  const WebSocket = require('ws');

//Repeated function
function getTeacherData(classroomId) {
    const teacherUsername = classroomId.substring(0, classroomId.length - 1);
    const period = classroomId.substring(classroomId.length - 1);
    return { teacherUsername, period };
}

class QueueManager {
    // Imports the web socket server to use web sockets
    constructor(classroomId, wss) {
      this.classroomId = classroomId;
      this.queue = [];
      this.wss = wss;
    }
  
    //Check out button for student (adds student to queue)
    async enqueue(student) {
        const { teacherUsername, period } = getTeacherData(this.classroomId);
        const classroom = await Classroom.findOne({ username: teacherUsername, period });
        if(!classroom.studentsInside.includes(student)&& !this.queue.includes(student)) return;

        //Adds a student to queue
        this.queue.push(student);
        await this.addQueue(student);
      
        // If queue is empty, the dequeue process must be prompted manually
        const queueWasEmpty = this.queue.length === 0;
        if (queueWasEmpty) {
          await this.dequeue();
        }
    }

    //Cancel button for student (removes from queue to inside)
    async removeFromQueue(student) {
        const index = this.queue.indexOf(student);
        const { teacherUsername, period } = getTeacherData(this.classroomId);
        const classroom = await Classroom.findOne({ username: teacherUsername, period });
        
        //Updates MongoDB to move from waiting to inside list
        if (index !== -1) {
            if (classroom.studentsWaiting.includes(student)) {
                await Classroom.findOneAndUpdate(
                  { username: teacherUsername, period },
                  {
                    $pull: { studentsWaiting: student },
                    $push: { studentsInside: student }
                  }
                );
              }
          //Removes student
          this.queue.splice(index, 1); 

          //WS broadcast
          this.broadcast('remove', this.classroomId);
          return true;
        }
        return false; 
    }

    //Manually removes student (teacher CRUD function)
    async manualDequeue(student) {  
        const index = this.queue.indexOf(student);
        if (index !== -1) {
          // removes specific student
          this.queue.splice(index, 1);
          await this.removeQueue(student);
          return true;
        }
        return false;
    }
  
    //Sets a time out to remove a student from queue to outside list
    async dequeue() {
        const { teacherUsername, period } = getTeacherData(this.classroomId);
        const classroom = await Classroom.findOne({ username: teacherUsername, period });
        const outsideLength = classroom.studentsOutside.length;
       
        if (this.queue.length > 0) {
          //Checks amount of students already outside to determine to wait or automatic dequeue
          const transferThreshold = 2;
       
          if (outsideLength >= transferThreshold) {
            
            const transferTime = 5 * 60 * 1000;
            setTimeout(async () => {
                    await this.repeatDequeue();
            }, transferTime);
          } else {
            await this.repeatDequeue();
          }
        }
    }

    //Repeats dequeue process if queue is still populated
    async repeatDequeue() {
      if (this.queue.length > 0) {
        const student = this.queue.shift();
        await this.removeQueue(student);
        await this.dequeue();
      }
    }
  
    //Adds students to the MongoDB database and broadcasts to clients
    async addQueue(student) {
        const { teacherUsername, period } = getTeacherData(this.classroomId);
        const classroom = await Classroom.findOne({ username: teacherUsername, period });
      
        //Updates MongoDB
        if (classroom.studentsInside.includes(student)) {
          await Classroom.findOneAndUpdate(
            { username: teacherUsername, period },
            {
              $pull: { studentsInside: student },
              $push: { studentsWaiting: student }
            }
          );
        }
        //Broadcast
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.classroomId === this.classroomId) {
              client.send(JSON.stringify({ action: 'add-to-queue', student }));
            }
          });
    }

    //Removes student on the MongoDB database and broadcasts to clientts
    async removeQueue(student) {
        const { teacherUsername, period } = getTeacherData(this.classroomId);
        const classroom = await Classroom.findOne({ username: teacherUsername, period });
        
         //Updates MongoDB
        if (classroom.studentsWaiting.includes(student)) {
          await Classroom.findOneAndUpdate(
            { username: teacherUsername, period },
            {
              $pull: { studentsWaiting: student },
              $push: { studentsOutside: student }
            }
          );
        }

        // Broadcast to clients
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN  && client.classroomId === this.classroomId) {
                const classroomId = this.classroomId;
                client.send(JSON.stringify({ action: 'cancel', classroomId }));
            }
        });
        
    }
    
    //Broadcasts queue action with web socket
    broadcast(action, classroomId) {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.classroomId === classroomId) {
          client.send(JSON.stringify({ action, classroomId }));
        }
      });
    }
}
  
module.exports =  QueueManager;
  