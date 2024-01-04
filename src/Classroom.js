import React from 'react';
import {useState, useEffect, useRef} from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Alert from './Alert';
import { modelNames } from 'mongoose';
export const Classroom = () => {
  const Navigate = useNavigate();
  //Classroom Verification
    const { classroomId } = useParams();
    const [classroomData, setClassroomData] = useState(null);
    async function fetchData() {
      console.log("Tried to fetch");
      try {
          const response = await fetch('https://dmg0caf7ytwae.cloudfront.net/classroom/'+classroomId, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
              },
          //    credentials: 'include',
          });
          if (response.status === 302) {
            window.location.href = '/login'; // Redirect to the '/login' route
        }
          if (!response.ok) {
              throw new Error("Couldn't fetch classroom");
          }
          const data = await response.json();
          setClassroomData(data);
      } catch (error) {
          console.error('Error:', error);
      }
    }
  useEffect(() => {
    // Call the async function
    fetchData();
  }, [classroomId]);


  //Cookie data
  const temp = Cookies.get('sessionData');
  const cookieData = JSON.parse(temp || '{}');
  const username = cookieData?.username || '';
  const teacher = cookieData?.teacher || false;
  const className ="N/A";
  const period = classroomId.charAt(classroomId.length - 1);

//Update lists
  const [studentsInside, setStudentsInside] = useState([]);
const [studentsOutside, setStudentsOutside] = useState([]);
const [studentsWaiting, setStudentsWaiting] = useState([]);
const [studentsRequests, setStudentsRequests] = useState([]);
const [selectedName, setSelectedName] = useState('');
const [inputName, setInputName] = useState('');
const fetchUpdatedData = async () => {
  try {
      const response = await fetch('https://dmg0caf7ytwae.cloudfront.net/class/lists/' + classroomId, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
          },
         // credentials: 'include',
      });
      if (response.status === 302) {
        window.location.href = '/dashboard'; // Redirect to the '/login' route
    } 
      if (!response.ok) {
          throw new Error("Couldn't logout");
      }
      const { studentsInside, studentsOutside, studentsWaiting, studentsRequests } = await response.json(); // Destructure the received data
      // Update your state with the received data
      setStudentsInside(studentsInside);
      setStudentsOutside(studentsOutside);
      setStudentsWaiting(studentsWaiting);
      setStudentsRequests(studentsRequests);
  } catch (error) {
      console.error('Error:' +  error);
  }
}

  //WebSocket
  const ws = useRef(null);

  // Listen for incoming chat messages
  useEffect(() => {
    ws.current = new WebSocket(`wss://dmg0caf7ytwae.cloudfront.net/ws?sessionId=${username}&classroomId=${classroomId}`);

    ws.current.onopen = () => {
      console.log('Connected to the WebSocket server');
      if(!teacher)addInside(username);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { action, name } = data;
        // Handle the data received from the server
        // Update your frontend lists based on the action and studentId
        switch (action) {
          case 'add-to-inside':
            console.log("Calling Added to inside function...");
            fetchUpdatedData();
            break;
          case 'move-to-waiting':
            console.log("Calling move to waiting function...");
            fetchUpdatedData();
            break;
          case 'move-to-inside':
            console.log("Calling moveInside function...");
            fetchUpdatedData();

            break;
          case 'move-to-outside':
            console.log("Calling moveOutside function...");
            fetchUpdatedData();
            break;
          case 'handle-student-request':
            const { request } = data;
            console.log("Calling handleRequest function...");
            fetchUpdatedData();
            break;
          case 'add-to-queue':
            console.log("Calling queue.");
            fetchUpdatedData();
            setGreen('Added '+name + ' to queue');
            break;
          case 'remove-queue':
            console.log("Calling queue.");
            fetchUpdatedData();
            setDel('Removed '+name + ' from queue');
            break;
          case 'cancel':
            console.log("Canceling queue.");
            fetchUpdatedData();
            setDel('Dequeued');
            break;
          case 'navigateToHome':
            window.location.href = '/dashboard'; 
            break;
          case 'kick':
            
            if(name===username){
              alert('You have been kicked out');
              window.location.href = '/dashboard';}; 
            fetchUpdatedData();
            break;
          default:
          
            fetchUpdatedData();
            console.error('Invalid action');
        }
      } catch (error) {
        console.error('Error parsing the message:', error);
      }
  
    };

    ws.current.onclose = event => {
      console.log('Disconnected from the WebSocket server', event.code, event.reason);
      setTime(9999999999);
      setDel("You have been idle for too long, please refresh");
    };

    ws.current.onerror = error => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  
  const sendWebSocketMessage = (action, name = '', request = '') => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const temp1 = Cookies.get('sessionData');
      const cookieData1 = JSON.parse(temp || '{}');
      const message = JSON.stringify({ action, classroomId, name, request });
      ws.current.send(message);
    } else {
      console.error('WebSocket is not open or not ready.');
    }
  };
  const addInside = (name) => {
    if(name==='') return;
    if(studentsInside.includes(name)||studentsWaiting.includes(name)||studentsOutside.includes(name)){
      alert('Student already inside');
      return;
    }
    if(teacher){
      if (window.confirm('Do you want to add ' + name + ' to class?')) {
      sendWebSocketMessage('add-to-inside', name);
    } else {
      // Logic for cancellation
    }
  }else{
    sendWebSocketMessage('add-to-inside', name);
  }
  };

  const moveWait = (name) => {
    if(name==='') return;
    if(teacher){
      if (window.confirm('Do you want to move ' + name + ' to queue?')) {
      sendWebSocketMessage('move-to-waiting', name);
    } else {
      // Logic for cancellation
    }
  }else{
    sendWebSocketMessage('move-to-waiting', name);
  }
    
  };

  const moveIn = (name) => {
    if(name==='') return;
    if(teacher){
      if (window.confirm('Do you want to move ' + name + ' inside?')) {
      sendWebSocketMessage('move-to-inside', name);
    } else {
      // Logic for cancellation
    }
  }else{
    sendWebSocketMessage('move-to-inside', name);
  }
  };

  const moveOut = (name) => {
    if(name==='') return;
    if(teacher){
      if (window.confirm('Do you want to move ' + name + ' outside of class?')) {
      sendWebSocketMessage('move-to-outside', name);
    } else {
      // Logic for cancellation
    }
  }else{
    sendWebSocketMessage('move-to-outside', name);
  }
  };
  const cancel = (name) => {
    if(name==='') return;
    if(teacher){
      if (window.confirm('Do you want to cancel ' + name + ' from queue?')) {
      sendWebSocketMessage('cancel', name);
    } else {
      // Logic for cancellation
    }
  }else{
    sendWebSocketMessage('cancel', name);
  }
  };
  const kick = (name) => {
    if(name==='') return;
    if(teacher){
      if (window.confirm('Do you want to kick ' + name + ' out of class?')) {
      sendWebSocketMessage('kick', name);
    } else {
    }
  }else{
    sendWebSocketMessage('kick', name);
  }
  };
  const exit = (name) => {
    if(name==='') return;
    if(teacher){
      window.location.href = '/dashboard'; 
    }
    else if(window.confirm('Are you sure you want to exit?\nYou will be taken outside of the class')){
      sendWebSocketMessage('kick', name);
      window.location.href = '/dashboard'; 
    }
  };
//Generate Class
const deleteClassroom = async (name) => {
  if(name==='') return;
  else if(!window.confirm('Are you sure you want to delete?\nClassroom will not be saved')){
    return;
  }
  try {
    const response = await fetch('https://dmg0caf7ytwae.cloudfront.net/classrooms/'+username, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      //credentials: 'include',
    });
    if (!response.ok) {
      // Handle non-success HTTP status codes (e.g., 404)
      const errorData = await response.json(); // Error data is fetched and parsed as JSON
      throw new Error(errorData.error); // Log the error message
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
  const handleReq = (request) => {
    sendWebSocketMessage('handle-student-request', '', request);
  };
 
useEffect(()=>{
    fetchUpdatedData();
}, []);

//Alerts
const [del, setDel] = useState("");
const [green, setGreen] = useState("");
const [time, setTime] = useState(2000);
useEffect(() => {
  // Custom alert logic
  const timer = setTimeout(() => {
    setDel("");
  }, time);

  return () => {
    clearTimeout(timer);
  };
}, [del]);
useEffect(() => {
  // Custom alert logic
  const timer = setTimeout(() => {
    setGreen("");
  }, time);

  return () => {
    clearTimeout(timer);
  };
}, [green]);
   if (classroomData === null || temp ===null ) {
    return <div>Loading...</div>;
  }

  return (<>

    <div className="Classroom">
    {del!=="" && <Alert message={del} ok ={false}/>}
    {green!=="" && <Alert message={green} ok ={true}/>}
    <button className = "exit" onClick={() => exit(username)}>Dashboard</button>
    {teacher && <button className = "delete" onClick={() => deleteClassroom(username)}>End Session</button>}
    <h1>Welcome to Your Classroom</h1>
    <p>{teacher? "Teacher: " + username : "Student: " + username}</p>
    <p>Period: {period}</p>
    <p>Class: {classroomData[0].username + " / " + classroomData[0].className}</p>

    <div className="section">
    <div className="INSIDE">
  <p>INSIDE</p>
  <ul>
    {studentsInside.map((student, index) => (
      <li key={index}>{student}</li>
    ))}
  </ul>
</div>

<div className="OUTSIDE">
  <p>OUTSIDE</p>
  <ul>
    {studentsOutside.map((student, index) => (
      <li key={index}>{student}</li>
    ))}
  </ul>
</div>

<div className="QUEUE">
  <p>QUEUE</p>
  <ul>
    {studentsWaiting.map((student, index) => (
      <li key={index}>{student}</li>
    ))}
  </ul>
</div>

<div className="PASSES">
  <p>REQUEST</p>
  <ul>
    {studentsRequests.map((student, index) => (
      <li key={index}>{student}</li>
    ))}
  </ul>
</div>
    </div>

  
  </div>

  <div className = "Control">{
  teacher ? (<>
    <div>
    <input
        type="text"
        value={inputName}
        onChange={(e) => setInputName(e.target.value)}
        placeholder="Enter name here"
      />
      <button onClick={() => addInside(inputName)}>Add Student to Inside</button>
    </div>
    <div>
      <select value={selectedName} onChange={(e) => setSelectedName(e.target.value)}>
        <option value="">Select a name</option>
        
        {studentsWaiting.map((name, index) => (
          <option key={index} value={name}>
            {name}
          </option>
        ))}
        {studentsInside.map((name, index) => (
          <option key={index} value={name}>
            {name}
          </option>
        ))}
        {studentsOutside.map((name, index) => (
          <option key={index} value={name}>
            {name}
          </option>
        ))}
      </select>
      <button onClick={() => moveWait(selectedName)}>Move Student to Waiting List</button>
      <button onClick={() => moveOut(selectedName)}>Move Student to Outside</button>
      <button onClick={() => moveIn(selectedName)}>Move Student to Inside</button>
      <button onClick={() => kick(selectedName)}>Kick Out</button>
      <button onClick={() => handleReq('bathroom')}>Handle Request</button>
    </div></>

  ) : (
    <>
     {studentsInside.includes(username) && <button className = "CheckOut" onClick={() => moveWait(username)}>CHECK OUT</button>}
       {studentsOutside.includes(username) && <button className = "CheckIn" onClick={() => moveIn(username)}>CHECK IN</button>}
      {studentsWaiting.includes(username) &&  <button className = "cancelB"onClick={() => cancel(username)}>CANCEL</button>}
    </>
  )
}
    </div>
    
  </>
  );
};

export default Classroom;