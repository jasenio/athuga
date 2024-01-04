//imports
const cookieParser = require('cookie-parser');
const express = require('express');
const session = require('express-session');
const cors = require('cors');

//Middleware configuration function
const configureMiddleware = (app) => {
  app.use(express.json());
  app.use(cookieParser());
  app.use(session({secret: process.env.secret, 
                 resave: false, 
                 saveUninitialized:true,
                 cookie: {
                  secure: true,
                  httpOnly: false,
                  maxAge: 24 * 60 * 60 * 1000, 
                  sameSite:"None",
                  path:"/",
                  domain: "athuga.com",
                 }}));
    const test = false;
    const host = test? "http://localhost:3000" : "https://athuga.com";
    app.use(cors({
      origin: 'https://athuga.com', // Replace with the actual origin of your frontend application
      methods: 'OPTIONS, GET, POST, DELETE',
      allowedHeaders: '*', // Make sure to replace this with the actual allowed headers
      credentials: true,
    }));
};

module.exports = { configureMiddleware };