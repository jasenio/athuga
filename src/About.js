import {useNavigate} from "react-router-dom";
import {useState, useEffect} from "react";
import {NavLink} from "react-router-dom";
import images from "./image";
export const About = () => {
    return <div className = "About">
        <div></div>
        <h1>About</h1>
        <p>Athuga is a web app for teachers to keep track of students inside or outside the classroom.
            It incorporates a queue to automatically excuse students who want to leave to use the restroom. 
            In addition, administrators can send messages to teachers in order to digitalize hall passes 
            and to provide an easier method for students to leave under medical, school,
            or extracurricular related absences.
        </p>
        <h1>Teachers</h1>
        <p>A teacher is given a dashboard of their different classrooms as well as their current classroom if hosting.
        </p>
        <img src = {images.Current}></img>
        <p>When class starts each day, a teacher will activate the class session by simply clicking on the appropriate period.</p>
        <img src = {images.Create}></img>
        <p>When activating a class, a teacher can view students inside the classroom, waiting to leave, outside, or requests from the admin.
            Additionally, the teacher has the ability to override the student controls as well as adding students to the class who don't log on.
            In this sense, Athuga can serve as an attendance app for all students to sign in or as a tool for a teacher to track solely students waiting to leave 
            or students already outside.
        </p>
        <img src = {images.TeacherClass}></img>
        <div>          </div>
        <h1>Students</h1>
        <p>Students are given the same dashboard but are only able to connect to their respective teachers' classrooms</p>
        <img src = {images.StudentDash}></img>
        <p>From the classroom, students are only able to check in or check out</p>
        <img src = {images.StudentClass}></img>
        <div>          </div>
        <h1>Administrators</h1>
        <p>Administrators have a special panel from which they can view all current classrooms open and to send a message to any classrooms.
            The updates in classrooms are live, allowing real time information to be sent to them.
        </p>
        <img src = {images.Admin}></img>
        <div></div>
        <NavLink to="/" className = "Home">Back to Home</NavLink>
    </div>
}

