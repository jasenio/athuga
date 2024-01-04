import {useState, useEffect} from "react";
import { useLocation, Navigate } from 'react-router-dom';
import {useNavigate} from "react-router-dom";
import Alert from './Alert';
import Cookies from 'js-cookie';
export const Dashboard = () => {
    const Navigate = useNavigate();

    //Logging out
    function deleteCookie(cookieName) {
      document.cookie = cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
    const logout = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('https://dmg0caf7ytwae.cloudfront.net/logout', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
           //     credentials: 'include',
            });
            if (response.status === 302) {
              window.location.href = '/login'; // Redirect to the '/login' route
          } 
            if (!response.ok) {
                throw new Error("Couldn't logout");
            }
            deleteCookie('sessionData');
            deleteCookie('connect.sid');
            Navigate('/');
        } catch (error) {
            console.error('Error:' +  error);
        }
    }

    //Cookie data
    const temp = Cookies.get('sessionData');
    const cookieData = JSON.parse(temp || '{}');
    const username = cookieData?.username || '';
    const teacher = cookieData?.teacher || false;
    const [message, setMessage] = useState(false);
    //Alerts
    const [del, setDel] = useState("");
    const [green, setGreen] = useState("");
    //Selected
    const [perNum, setPerNum] = useState(0);
    const [perClass, setPerClass] = useState("");
    //Current
    const [curper, setCurper] = useState(0);
    const [curc, setCurc] = useState("");
    //Loading
    const time = 2000;
    
    

    const fetchData = async() => {
        console.log("Tried to fetch");
        const temp = Cookies.get('sessionData');
        const cookieData = JSON.parse(temp || '{}');
        const periods = cookieData.periods;
        try {
          const url = `https://dmg0caf7ytwae.cloudfront.net/classrooms/${username}`;
          const options = {
            method: 'POST',
            body: JSON.stringify({periods}),
            headers: {
              'Content-Type': 'application/json',
            },
           // credentials: 'include',
          };
          
          const response = await fetch(url, options);
            if (!response.ok) {
              const errorData = await response.json(); // Error data is fetched and parsed as JSON
              throw new Error(errorData.error); // Log the error message
            }
            if (response.status === 302) {
              window.location.href = '/login'; // Redirect to the '/login' route
          }
            const data = await response.json();
            setCurper(data[0].period);
            setCurc(data[0].className);
        } catch (error) {
          console.error('Error:' + error);
        }
      }
    useEffect(() => {
      // Call the async function
      if(teacher) fetchData();
      if(Cookies.get('sessionData')===null)  window.location.href = '/login';
    }, []);
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
    //Authorization
    const isauth = () => {
        const userId = Cookies.get('sessionData');
        return(!!userId);
      }

      //Generate Class
      const createClassroom = async () => {
        try {
          const response = await fetch('https://dmg0caf7ytwae.cloudfront.net/classrooms/', {
            method: 'post',
            body: JSON.stringify({ username, perNum, perClass }),
            headers: {
              'Content-Type': 'application/json',
            },
            //credentials: 'include',
          });
          if (response.status === 302) {
            window.location.href = '/login'; // Redirect to the '/login' route
        }
          if (!response.ok) {
            // Handle non-success HTTP status codes (e.g., 404)
            const errorData = await response.json(); // Error data is fetched and parsed as JSON
            throw new Error(errorData.error); // Log the error message
          }

          const data = await response.json();
          setCurper(perNum);
          setCurc(perClass);
          if(data.username){
            setDel("Deleted classroom: " + "Period " + data.period + " - " + data.className);
            setTimeout(() => {
              setGreen("Created classroom: " + "Period " + perNum + " - " + perClass);
            }, time);
          }
          else setGreen("Created classroom: " + "Period " + perNum + " - " + perClass);

          
        //Navigate(`/Dashboard/`+id);
        } catch (error) {
          console.error('Error:', error);
          // Handle the error, e.g., display an error message to the user
        }
      };
    
      //Checks if there is a classroom is available
      const checkClassroom =  async (teacherUsername, periodNumber, periodClass) =>  {
        console.log("Checking classroom");
        if(teacherUsername==='None'){
          alert('No Class');
          return;
        }
        try {
          const url = `https://dmg0caf7ytwae.cloudfront.net/classrooms/${teacherUsername}`;
          const temp = Cookies.get('sessionData');
          const cookieData = JSON.parse(temp || '{}');
          const periods = cookieData.periods;
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
              window.location.href = '/login'; // Redirect to the '/login' route
          }
            if (!response.ok) {
                // Handle non-success HTTP status codes (e.g., 404)
                const errorData = await response.json(); // Error data is fetched and parsed as JSON
                throw new Error(errorData.error); // Log the error message
            } 

            //Found class
            const data = await response.json();
            if(data[0].period !== periodNumber){
                setDel("No Classroom found for teacher: "+teacherUsername + " Period "+periodNumber);
                if(teacher) openCreate(periodNumber, periodClass);
            }
            
            //Handles navigation
            else{
                 setGreen("Entered Class");
                const id = teacherUsername + periodNumber;
                Navigate(`/Dashboard/`+id);
            }

        } catch (error) {
            if (error.message === 'No classrooms found for the teacher') {
                //Found class
                setDel("No Classroom found for teacher: "+teacherUsername + " Period "+periodNumber);
                if(teacher) openCreate(periodNumber, periodClass);
            }
            // Handle the error, e.g., display an error message to the user
        }
    }

    //Create class message
    const openCreate = (periodNumber, periodClass) => {
        setPerNum(periodNumber);
        setPerClass(periodClass);
        setMessage(true);
      };
      const request = () => {
        Navigate('/Request');
        window.location.href = '/Request'; 
    };

    return <div className = "Dashboard">
       <div>{username}</div>
       <div>{teacher ? "Teacher" :  "Student"}</div>
       {curper>0 && <p>{"Current: " + curper + " - " + curc}</p>}
       {del!=="" && <Alert message={del} ok ={false}/>}
       {green!=="" && <Alert message={green} ok ={true}/>}
       <button className ="Logout" onClick = {logout}>LOGOUT</button>
{teacher&&<button className ="Request" onClick={() => request()}>ADMIN ONLY</button>}
       <div className = "ClassPeriods">
            <p>Class Periods</p>
            {cookieData.periods.map((period)=>{
                return <button className={`button ${period.periodNumber === curper ? 'active-Period' : 'Period'}`}
                               key = {period.periodNumber} 
                               onClick = {()=>{     if(temp==='undefined') Navigate('/');
                                        if(del!==""||green!=="")setTimeout(()=>{
                                        
                                            checkClassroom(period.teacher, period.periodNumber, period.periodClass);
                                          }, time)
                                        else{
                                          checkClassroom(period.teacher, period.periodNumber, period.periodClass);}}}>
                    <p>{period.periodNumber}</p>
                    <p>{period.periodClass}</p>
                    <p>{period.teacher}</p>
                </button>
            })}
       </div>
       {message && <div className = "popup"><>
      <div className="Create">
        <p>Create New Classroom?</p>
        {curper>0 && <p>{"Override: Period " + curper + " - " + curc + "?"}</p>}
        <p>{username + " " + perClass + " - " + perNum}</p>
        <button
          className="CreateClass"
          onClick={() => {
            createClassroom();
            setMessage(false);
          }}
        >
          Yes
        </button>
        <button className="clickOut" onClick={() => setMessage(false)}>
          No
        </button>
      </div>
    </>
       
       
       </div>}
    </div>
}

