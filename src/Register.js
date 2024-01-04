import {useNavigate} from "react-router-dom";
import {useState} from "react";
import {NavLink} from "react-router-dom";

export const Register = () => {
    const [username, setName] = useState("");
    const [password, setPassword] = useState("");
    const [teacher, setTeacher] = useState(false);
    const [error, setError] = useState(false);
    const [periods, setPeriods] = useState([
      { periodNumber: 1, periodClass: '', teacher: teacher ? username : '' },
      { periodNumber: 2, periodClass: '', teacher: teacher ? username : '' },
      { periodNumber: 3, periodClass: '', teacher: teacher ? username : '' },
      { periodNumber: 4, periodClass: '', teacher: teacher ? username : '' },
      { periodNumber: 5, periodClass: '', teacher: teacher ? username : '' },
      { periodNumber: 6, periodClass: '', teacher: teacher ? username : '' },
      { periodNumber: 7, periodClass: '', teacher: teacher ? username : '' },
      { periodNumber: 8, periodClass: '', teacher: teacher ? username : '' },
    ]);
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();

          if (window.confirm('Are you sure you want to submit?')) {
              // Logic for confirmation
            } else {
              // Logic for cancellation
              return;
  
            }
            
        try {
          const updatedPeriods = periods.map((period) => {
            const updatedPeriod = { ...period };
        
            if (updatedPeriod.periodClass === '') {
              updatedPeriod.periodClass = 'None';
            }
        
            if (updatedPeriod.teacher === '') {
              
              if(teacher){
                updatedPeriod.teacher = username;
              }else{
                updatedPeriod.teacher = 'None';
              }
            }
        
            return updatedPeriod; // Don't forget to return the updated period object
          });
            setPeriods(updatedPeriods);
          const response = await fetch('https://dmg0caf7ytwae.cloudfront.net/register', {
            method: 'post',
            body: JSON.stringify({ username, password, teacher, updatedPeriods }),
            headers: {
              'Content-Type': 'application/json',
            },
          });
      
          if (!response.ok) {
            throw new Error("Couldn't register");
          }
      
          const data = await response.json();
          // Handle the data as needed
          
          alert("Data saved successfully");
          navigate("/login");
        } catch (error) {
          console.error('Error:', error);
          setError(true);
          // Handle the error, e.g., display an error message to the user
        }
      };

    return <div className = "Register">
        <form id = "p1" onSubmit = {handleSubmit}>
                <label htmlFor="Teacher">Teacher <span>{}</span> </label>
                <input className = "CheckTeacher" type="checkbox" placeholder="Teacher" value={teacher} onChange={(e) => setTeacher(e.target.checked)} /> 
                {teacher && <p>If you are a teacher, your username should be your EXACT NAME</p>}
                {teacher && <p>First letter of first name and full last name, CASE SENSITIVE, ex: John Smith = JSmith</p>}
                <label htmlFor="Username">Username <span>{}</span> </label>
                <input type="text" placeholder="Username" value={username} onChange={(e) => setName(e.target.value)} />
                <label htmlFor="Password">Password <span>{}</span> </label>
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                {!teacher && <p>If you are a student, edit the class name as you wish, but type your teacher's EXACT NAME</p>}
                {!teacher && <p>First letter of teacher's first name, teacher's full last name, ex: John Smith = JSmith</p>}
                {teacher && <p>Class names do not have to be precise</p>}
                <p>If you don't have a class for a period, leave section blank</p>

        {periods.map((period, index) => (
          <div key={index}>
          <label htmlFor={`Period-${index + 1}`}>{`P${index+1}`} </label>
          <input
            type="text"
            placeholder="Period Class"
            value={period.periodClass}
            onChange={(e) => {
              const updatedPeriods = [...periods];
              updatedPeriods[index].periodClass = e.target.value;
              setPeriods(updatedPeriods);
            }}
          />
          {!teacher &&
          <>
          <input
            type="text"
            placeholder="Teacher"
            value={period.teacher}
            onChange={(e) => {
              const updatedPeriods = [...periods];
              updatedPeriods[index].teacher = e.target.value;
              setPeriods(updatedPeriods);
            }}
          /></>}
        </div>
      ))}
         <p className = "Warning">Registration of teachers and classes are NOT REVERSIBLE</p>
        </form>
        <button type = "submit" className = "registerButton" form="p1">Register</button>
        <NavLink to="/Login" className = "Register">Already Registered?</NavLink>
        <NavLink to="/" className = "Home">Back to Home</NavLink>
        {error && <div className = "error">Error registering</div>}
    </div>
}

