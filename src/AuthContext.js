import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get the teacherStatus cookie value
    const id = Cookies.get('userId');

    // Check if teacherStatusCookie is defined
    if (id !== undefined) {
    setUser({ userId: id });
  }


  }, []);


  return (
    <AuthContext.Provider value={{user}}>
      {children}
    </AuthContext.Provider>
  );
};
