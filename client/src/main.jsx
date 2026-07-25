import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/MainMenu';
import './index.css'; // This initializes Tailwind

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);