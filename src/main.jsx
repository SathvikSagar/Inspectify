// src/main.jsx
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'leaflet/dist/leaflet.css';
import SimpleLoader from './components/SimpleLoader.jsx';
import { DarkModeProvider } from './context/DarkModeContext';

// Remove any dark mode classes from document
document.documentElement.classList.remove('dark-mode');
document.body.classList.remove('dark-mode');
localStorage.setItem('darkMode', 'false');

const Root = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <React.StrictMode>
      <DarkModeProvider>
        {loading ? <SimpleLoader /> : <App />}
      </DarkModeProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)
