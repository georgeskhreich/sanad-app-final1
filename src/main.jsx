import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// نقطة انطلاق التطبيق وبدء رندر المكونات في المتصفح
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
