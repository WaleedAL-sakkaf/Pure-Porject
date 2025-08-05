import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Mock service imports are removed as data will come from a backend.
// API service functions will be directly imported by pages/components that need them.
// Auth service self-initializes user from localStorage if available, managed by AuthProvider.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);