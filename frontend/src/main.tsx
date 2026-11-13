import { StrictMode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/AuthProvider'
import { initAppearance } from './lib/appearance'
import { queryClient } from './lib/query-client'

initAppearance()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
