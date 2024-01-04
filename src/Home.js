import {NavLink} from "react-router-dom";
export const Home = () => {
    return (
        <div className="Home">
            <h1 className="title">ATHUGA</h1>
            <div className="button-container">
                <NavLink to="/Register" className="button">Register</NavLink>
                <NavLink to="/Login" className="button">Login</NavLink>
                <NavLink to="/Dashboard" className="button">Dashboard</NavLink>
                <NavLink to="/About" className="button">About</NavLink>
            </div>
        </div>
    );
}

