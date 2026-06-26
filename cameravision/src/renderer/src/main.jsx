import './assets/output.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles' // Use @mui/material/styles
import { HashRouter, Routes, Route } from 'react-router-dom'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      light: '#a5b4fc', // indigo-300
      main:  '#6366f1', // indigo-500
      dark:  '#4338ca', // indigo-700
      contrastText: '#fff'
    },
    secondary: {
      light: '#67e8f9', // cyan-300
      main:  '#22d3ee', // cyan-400
      dark:  '#0891b2', // cyan-600
      contrastText: '#000'
    },
    white: {
      main: '#ffffff',
      contrastText: '#000'
    }
  }
})

import App from './App'
import Recording from './Recording'
import RecordEditor from './RecordEditor'
import AutoDetection from './AutoDetection'
import CounterResults from "./CounterResults"

// Assign Tailwind and custom CSS classes to the body
const rootElement = document.getElementById('root')
rootElement.className = 'min-h-screen min-w-screen bg-main-700'

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
