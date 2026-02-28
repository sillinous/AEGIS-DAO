import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { Web3Provider } from './contexts/Web3Context';
import { ToastProvider } from './contexts/ToastContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Web3Provider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </Web3Provider>
    </BrowserRouter>
  </React.StrictMode>
);
