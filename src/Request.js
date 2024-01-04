import React from 'react';
import {useState, useEffect, useRef} from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Alert from './Alert';

export const Request = () => {
   //Cookie data
   const temp = Cookies.get('sessionData');
   const cookieData = JSON.parse(temp || '{}');
   const username = cookieData?.username || '';
   const teacher = cookieData?.teacher || false;

  const [v, setV] = useState(false);
    const fetchData = async()=> {
      console.log("Tried to fetch");
      try {
        const temp = Cookies.get('sessionData');
        const cookieData = JSON.parse(temp || '{}');
        const periods = cookieData.periods;
        
          const url = `https://dmg0caf7ytwae.cloudfront.net/all-class/${username}/`;
          const options = {
            method: 'POST',
            body: JSON.stringify({periods}),
            headers: {
              'Content-Type': 'application/json',
            },
           // credentials: 'include',
          };
        
          const response = await fetch(url, options);
         
          if (response.status === 302) {
          
            alert('Administrators only');
            window.location.href = '/dashboard'; // Redirect to the '/login' route
        }
          if (!response.ok) {
           
              throw new Error("Admin only");
          }
          
          const {usernames} = await response.json(); // Destructure the received data
          // Update your state with the received data
          setV(true);
          setClasses(usernames);
      } catch (error) {
          console.error('Error:' + error,);
        
          if (error.message === "Admin only") {
            alert('Administrators only');
            window.location.href = '/dashboard'; // Redirect to the '/dashboard' route
          }
      }
    }


//Update lists
  const [classes, setClasses] = useState([]);
const [selectedName, setSelectedName] = useState('');
const [inputName, setInputName] = useState('');
const fetchUpdatedData = async () => {
  try {
    const temp = Cookies.get('sessionData');
    const cookieData = JSON.parse(temp || '{}');
    const periods = cookieData.periods;
   
      const url = `https://dmg0caf7ytwae.cloudfront.net/all-class/${username}/`;
      const options = {
        method: 'POST',
        body: JSON.stringify({periods}),
        headers: {
          'Content-Type': 'application/json',
        },
       // credentials: 'include',
      };
    
      const response = await fetch(url, options);
      
      if (response.status === 302) {
        
        alert('Administrators only');
        window.location.href = '/dashboard'; // Redirect to the '/login' route
    } 
    if (!response.ok) {
  
      throw new Error("Admin only");
  }
      const {usernames} = await response.json(); // Destructure the received data
      // Update your state with the received data
      setClasses(usernames);
      setV(true);
  } catch (error) {
      console.error('Error:' +  error);
      
  }
}

  //WebSocket
  const ws = useRef(null);

  // Listen for incoming chat messages
  useEffect(() => {
    ws.current = new WebSocket(`wss://dmg0caf7ytwae.cloudfront.net/ws?sessionId=${username}&classroomId=${username}`);

    ws.current.onopen = () => {
      console.log('Connected to the WebSocket server');
    };

    ws.current.onmessage = (event) => {
     
      try {
        const data = JSON.parse(event.data);
        const { action } = data;
        // Handle the data received from the server
        // Update your frontend lists based on the action and studentId
        switch (action) {
          case 'success':
            console.log("Success");
            fetchUpdatedData();
            setGreen('Success');
            break;
          case 'fail':
            console.log("Failed");
            fetchUpdatedData();
            setDel('Fail');
            break;
          case 'navigateToHome':
            console.log("Update teachers");
            setGreen("Update in classes");
            fetchUpdatedData();

            break;
        
          default:
          
            console.error('Invalid action');
            fetchUpdatedData();
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

  
  const sendWebSocketMessage = (action, name, request = '') => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ action, name, request });
      ws.current.send(message);
    } else {
      console.error('WebSocket is not open or not ready.');
    }
  };
  const send = (input) => {
    console.log("Send");
    if(input===''){
      alert('Please input a message');
      return;
    }
    if(!classes.includes(selectedName)){
      alert('Class not found');
      return;
    }

      if (window.confirm('Are you sure you want to send message to ' + selectedName)) {
      sendWebSocketMessage('send', selectedName, input, );
      console.log('Submission confirmed.');
    } else {
      // Logic for cancellation
      console.log('Submission cancelled.');
    }

  };





const exit = () => {
    window.location.href = '/dashboard'; 
};

useEffect(() => {
  if(teacher) fetchData();
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
   if (!v || temp ===null ) {
    return <div>Loading...</div>;
  }

  return (<>

    <div className="Admin">
    {del!=="" && <Alert message={del} ok ={false}/>}
    {green!=="" && <Alert message={green} ok ={true}/>}
    <button className = "exit" onClick={() => exit()}>Dashboard</button>
    <h1>{"Welcome " + username}</h1>
    <>
    <div>
    <input
        type="text"
        value={inputName}
        onChange={(e) => setInputName(e.target.value)}
        placeholder="Type message here"
      />
      <button onClick={() => send(inputName)}>Send Message</button>
    </div>
    <div>
      <select value={selectedName} onChange={(e) => setSelectedName(e.target.value)}>
        <option value="">Select a name</option>
        
        {classes.map((name, index) => (
          <option key={index} value={name}>
            {name}
          </option>
        ))}
      </select>

    </div></>
    </div>
    
  </>
  );
};

export default Request;