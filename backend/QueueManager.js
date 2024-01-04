// Import required modules and dependencies
const {
    Classroom,
  } = require('./classroom');
  const WebSocket = require('ws');
  function extractTeacherData(classroomId) {
    const teacherUsername = classroomId.substring(0, classroomId.length - 1);
    const period = classroomId.substring(classroomId.length - 1);
    return { teacherUsername, period };
}
class QueueManager {
    constructor(classroomId, wss) {
      this.classroomId = classroomId;
      this.queue = [];
      this.timer = null;
      this.wss = wss;
    }
  
    async enqueue(student) {
    
        const { teacherUsername, period } = extractTeacherData(this.classroomId);
        const classroom = await Classroom.findOne({ username: teacherUsername, period });
        if(!classroom.studentsInside.includes(student)&& !this.queue.includes(student)) return;
        const queueWasEmpty = this.queue.length === 0; // Check if the queue was initially empty
        this.queue.push(student);
        await this.addQueue(student);
        this.triggerQueueManager(); // Trigger additional actions based on the queue
      
        // Call dequeue if the queue was initially empty and a student joins
        if (queueWasEmpty) {
          await this.dequeue();
        }
      }
      async removeFromQueue(student) {
        const index = this.queue.indexOf(student);
        const { teacherUsername, period } = extractTeacherData(this.classroomId);
        const classroom = await Classroom.findOne({ username: teacherUsername, period });
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
          this.queue.splice(index, 1); // Remove the specific student from the queue
          this.triggerQueueManager();
          this.broadcast('remove', this.classroomId); // Broadcasting the removal to connected clients
          return true; // Indicate that the removal was successful
        }
        return false; // Indicate that the student was not found in the queue
      }
    async manualDequeue(student) {
       
        const index = this.queue.indexOf(student);
        if (index !== -1) {
          this.queue.splice(index, 1); // Remove the specific student from the queue
          await this.removeQueue(student);
          this.triggerQueueManager();
          return true;
        }
        return false;
      }
  
      async dequeue() {
      
        const { teacherUsername, period } = extractTeacherData(this.classroomId);
        const classroom = await Classroom.findOne({ username: teacherUsername, period });
        const outsideLength = classroom.studentsOutside.length;
       
        if (this.queue.length > 0) {
          const transferThreshold = 2;
       
          if (outsideLength >= transferThreshold) {
    
            const transferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
            setTimeout(async () => {
                    await this.transferToAnotherDatabase();
            }, transferTime);
          } else {
            await this.transferToAnotherDatabase();
          }
        }
      }
  
    async startTimer() {
      this.timer = setInterval(async () => this.dequeue(), 10 * 60 * 1000); // Dequeue every 5 minutes
    }
  
    async transferToAnotherDatabase() {
       
      if (this.queue.length > 0) {
        const student = this.queue.shift();
        await this.removeQueue(student);
        await this.dequeue();
        this.triggerQueueManager();
      }
    }
  
    async stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  
    async addQueue(student) {
      
        const { teacherUsername, period } = extractTeacherData(this.classroomId);
        const classroom = await Classroom.findOne({ username: teacherUsername, period });
      
        if (classroom.studentsInside.includes(student)) {
          await Classroom.findOneAndUpdate(
            { username: teacherUsername, period },
            {
              $pull: { studentsInside: student },
              $push: { studentsWaiting: student }
            }
          );
        }
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.classroomId === this.classroomId) {
              client.send(JSON.stringify({ action: 'add-to-queue', student }));
            }
          });
    }
    async removeQueue(student) {
        
        const { teacherUsername, period } = extractTeacherData(this.classroomId);
        const classroom = await Classroom.findOne({ username: teacherUsername, period });
        
        if (classroom.studentsWaiting.includes(student)) {
          await Classroom.findOneAndUpdate(
            { username: teacherUsername, period },
            {
              $pull: { studentsWaiting: student },
              $push: { studentsOutside: student }
            }
          );
        }
        // Broadcast the updated lists to all connected clients
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN  && client.classroomId === this.classroomId) {
                const classroomId = this.classroomId;
                client.send(JSON.stringify({ action: 'cancel', classroomId }));
            }
        });
        
      }
      broadcast(action, classroomId) {
        this.wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && client.classroomId === classroomId) {
            client.send(JSON.stringify({ action, classroomId }));
          }
        });
      }
    triggerQueueManager() {
      this.manageQueue();
    }
  
    manageQueue() {
      
      // Perform additional actions here based on the queue
    }
  }
  
module.exports =  QueueManager;
  