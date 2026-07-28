import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/ui/Toast'
import { ThemeProvider } from './context/ThemeContext'
import { DemoProvider } from './context/DemoContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <DemoProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </DemoProvider>
    </ThemeProvider>
  </StrictMode>,
)
