import './styles/App.css';
import {BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useLocation, Navigate } from 'react-router-dom';
import {Login} from "./Login";
import {Register} from "./Register";
import {Home} from "./Home";
import {Dashboard} from "./Dashboard";
import {Classroom} from "./Classroom";
import {Request} from "./Request";
import {About} from "./About";
import Cookies from 'js-cookie';
function App() {
  const isauth = () => {
    const userId = Cookies.get('sessionData');
    return(!!userId);
  }
  //Check if user is not authenticated and moves ot login
  const RequireAuth = ({ children }) => {
    const authed = isauth();
    if (!authed) console.log('Not Logged In');
    return authed ? children : <Navigate to="/Login" />;
  }
  //Checks if user is authenticated and moves to dashboard
  const RequireOut = ({ children }) => {
    const authed = isauth(); 
    if (authed) console.log('Already Logged In');
    return !authed ? children : <Navigate to="/Dashboard" />;
  }
  return (
    <div className="container">
      <Router>
        <Routes>
          <Route path = "/" element = {<RequireOut>
                <Home />
              </RequireOut>}/>
          <Route path = "/Register" element = {
              <RequireOut>
                <Register />
              </RequireOut>}/>
          <Route path = "/Login" element = {
              <RequireOut>
                <Login />
              </RequireOut>}/>
          <Route path = "/About" element = {
              <RequireOut>
                <About />
              </RequireOut>}/>
          <Route path="/Dashboard" element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          >
          </Route>
          <Route path="/Dashboard/:classroomId" element={
            <RequireAuth>
              <Classroom />
            </RequireAuth>} />
          <Route path="/Request" element={
              <RequireAuth>
                <Request />
              </RequireAuth>} />
          <Route path="*" element={<Navigate to="/" />} /> 
        </Routes>
        
      </Router>
     
    </div>
  );
}

export default App;
