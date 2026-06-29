import './assets/output.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles' // Use @mui/material/styles
import { HashRouter, Routes, Route } from 'react-router-dom'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#5eead4', // teal-300
      main:  '#14b8a6', // teal-500
      dark:  '#0f766e', // teal-700
      contrastText: '#ffffff'
    },
    secondary: {
      light: '#6ee7b7', // emerald-300
      main:  '#059669', // emerald-600
      dark:  '#065f46', // emerald-800
      contrastText: '#ffffff'
    },
  }
})

import App from './App'
import Recording from './Recording'
import RecordEditor from './RecordEditor'
import AutoDetection from './AutoDetection'
import CounterResults from "./CounterResults"

// Assign Tailwind and custom CSS classes to the body
const rootElement = document.getElementById('root')
rootElement.className = 'min-h-screen min-w-screen bg-slate-100'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/editor" element={<Recording />} />
          <Route path="/record" element={<RecordEditor />} />
          <Route path="/auto-counter" element={<AutoDetection />} />
          <Route path="/counter-results" element={<CounterResults />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  </StrictMode>
)
