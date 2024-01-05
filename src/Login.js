import {useNavigate} from "react-router-dom";
import {useState, useEffect} from "react";
import {NavLink} from "react-router-dom";
import Cookies from 'js-cookie';
export const Login = () => {
    //States
    const [username, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    //Login route call  
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log("Logging in");
            const response = await fetch('https://dmg0caf7ytwae.cloudfront.net/login', {
                method: 'post',
                body: JSON.stringify({ username, password }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                setError(true);
                const errorData = await response.json();
                throw new Error(errorData.error);
            }
            const data = await response.json();
        
            const { sessionId, userId, Username, teacher, periods } = data.sessionData;

            // Expiration
            const maxAge = 24 * 60 * 60 * 1000;
            const expirationDate = new Date(Date.now() + maxAge).toUTCString();

            // Create cookie manually
            document.cookie = `sessionData=%7B%22cookie%22%3A%7B%22originalMaxAge%22%3A${maxAge}%2C%22expires%22%3A%22${expirationDate}%22%2C%22secure%22%3Atrue%2C%22httpOnly%22%3Afalse%2C%22path%22%3A%22%2F%22%2C%22sameSite%22%3A%22None%22%7D%2C%22userId%22%3A%22${encodeURIComponent(userId)}%22%2C%22username%22%3A%22${encodeURIComponent(Username)}%22%2C%22teacher%22%3A${teacher}%2C%22periods%22%3A${encodeURIComponent(JSON.stringify(periods))}%7D; path=/; secure; samesite=None; expires=${expirationDate};`;

            navigate('/dashboard');
        } catch (error) {
            console.error('Error:', error);
            // Handle the error, e.g., display an error message to the user
        }
    }
    
    return <div className = "Login">
        <form id = "p1" onSubmit = {handleSubmit}>
                <label htmlFor="Username">Username <span>{}</span> </label>
                <input type="text" placeholder="Username" value={username} onChange={(e) => setName(e.target.value)} />
                <label htmlFor="Password">Password <span>{}</span> </label>
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </form>
        <button type = "submit" className = "loginButton" form="p1">Login</button>
        <NavLink to="/Register" className = "Register">Haven't registered?</NavLink>
        <NavLink to="/" className = "Home">Back to Home</NavLink>
        {error && <div className = "error">Not valid password/username</div>}
    </div>
}

