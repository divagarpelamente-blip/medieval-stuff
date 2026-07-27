import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // FIX: Point this to App.jsx, not MainMenu
import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);