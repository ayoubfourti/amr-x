import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/ui/Toast'
import { ThemeProvider } from './context/ThemeContext'
import { DemoProvider } from './context/DemoContext'
import { SidebarProvider } from './context/SidebarContext'
import { RosProvider } from './context/RosProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <DemoProvider>
        <RosProvider>
          <SidebarProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </SidebarProvider>
        </RosProvider>
      </DemoProvider>
    </ThemeProvider>
  </StrictMode>,
)
