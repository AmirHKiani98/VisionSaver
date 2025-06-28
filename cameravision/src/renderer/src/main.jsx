import './assets/output.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'; // Use @mui/material/styles

const theme = createTheme({
  palette: {
    primary: {
      light: '#a6ecf3',   // main-100
      main: '#b8c9df',    // main-200
      dark: '#18375e',    // main-700
      contrastText: '#000',
    },
    secondary: {
      light: '#ffffff',   // white
      main: '#f5f5f5',    // very light gray
      dark: '#cccccc',    // lower white (gray)
      contrastText: '#000',
    },
    white: {
      main: '#ffffff',
      contrastText: '#000',
    },
  },
});

import App from './App'

// Assign Tailwind and custom CSS classes to the body
document.body.className = 'min-h-screen min-w-screen bg-main-600';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </StrictMode>
)
