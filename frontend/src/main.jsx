import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import theme from './theme/index.js'
import './index.css'
import './styles/global.css'
import { logGoogleMapsKeyStatus } from './utils/testGoogleMapsKey.js'

// Test Google Maps API key on startup
if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
  logGoogleMapsKeyStatus().catch(console.error);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </StrictMode>,
)
