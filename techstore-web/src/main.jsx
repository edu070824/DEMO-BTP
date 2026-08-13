import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ParticlesProvider } from '@tsparticles/react'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { TechStoreProvider } from './context/TechStoreContext.jsx'
import { initializeParticles } from './utils/particles.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ParticlesProvider init={initializeParticles}>
        <AuthProvider>
          <TechStoreProvider>
            <App />
          </TechStoreProvider>
        </AuthProvider>
      </ParticlesProvider>
    </BrowserRouter>
  </StrictMode>,
)
