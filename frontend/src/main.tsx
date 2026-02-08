import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AiConfigProvider } from './shared/ai/aiConfigContext';
import { ToastProvider } from './components/ui/ToastContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AiConfigProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AiConfigProvider>
  </StrictMode>,
)
