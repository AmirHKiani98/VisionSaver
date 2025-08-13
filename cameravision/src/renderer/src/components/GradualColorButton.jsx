import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import "../assets/main.css"

const GradualColorButton = ({percentage=30, color="green", className="", onClick={}, buttonChildren=""}) => {
  

  const gradientStyle = {
    background: `linear-gradient(to right, ${color} ${percentage}%, transparent ${percentage}%)`,
  };

  return (
    <Button
      variant="contained"
      className={`text-white ${className}`}
      onClick={onClick}
      style={gradientStyle}
    >
        {buttonChildren ? buttonChildren : "Click Me"}
    </Button>
  );
};

export default GradualColorButton;
