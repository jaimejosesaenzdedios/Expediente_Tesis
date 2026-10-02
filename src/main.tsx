import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ProveedorDeSesion } from './sesion/Sesion.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProveedorDeSesion>
      <App />
    </ProveedorDeSesion>
  </StrictMode>,
)