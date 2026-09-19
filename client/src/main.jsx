import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.jsx';
import { store } from './redux/store.js';
import { checkAuth } from './redux/slices/auth.slice.js';
import { AppToaster } from './components/common/AppToaster.jsx';
import './index.css';

// Check authentication on mount
store.dispatch(checkAuth());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <AppToaster />
    </Provider>
  </React.StrictMode>,
);
