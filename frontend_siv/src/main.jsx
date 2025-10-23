import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';       // CSS de Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min.js';  // JS de Bootstrap (modales, dropdowns)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
