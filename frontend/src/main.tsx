import { StrictMode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import './tailwind.css'
import './styles.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/AuthProvider'
import { initAppearance } from './utils/appearance'
import { queryClient } from './api/query-client'

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
