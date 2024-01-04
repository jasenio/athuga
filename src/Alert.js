import React, { useState, useEffect } from 'react';

const Alert = ({ message, ok }) => {
if(ok)
  return (
    <div className="GoodAlert">
      {message}
    </div>
  );
  return (
    <div className="BadAlert">
      {message}
    </div>
  );
};

export default Alert;
