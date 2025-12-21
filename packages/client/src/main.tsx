import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpLink } from '@trpc/client'
import { trpc } from './lib/trpc'
import { ThemeProvider } from './contexts/ThemeContext'
import { AssistantProvider } from './contexts/AssistantContext'
import { ChatbotProvider } from './contexts/ChatbotContext'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/trpc',
      // Include credentials (cookies) in all requests
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        })
      },
    }),
  ],
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" switchable={true}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AssistantProvider>
              <ChatbotProvider>
                <App />
              </ChatbotProvider>
            </AssistantProvider>
          </AuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ThemeProvider>
  </React.StrictMode>,
)
