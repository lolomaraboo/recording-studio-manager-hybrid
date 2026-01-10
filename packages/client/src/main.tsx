import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpLink } from '@trpc/client'
import * as Sentry from '@sentry/react'
import { trpc } from './lib/trpc'
import { ThemeProvider } from './contexts/ThemeContext'
import { AssistantProvider } from './contexts/AssistantContext'
import { ChatbotProvider } from './contexts/ChatbotContext'
import { AuthProvider } from './contexts/AuthContext'
import { ClientPortalAuthProvider } from './contexts/ClientPortalAuthContext'
import App from './App'
import './index.css'

// Initialize Sentry error tracking
if (import.meta.env.VITE_SENTRY_DSN_FRONTEND) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN_FRONTEND,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.1, // 10% performance monitoring (free tier limit)
    replaysSessionSampleRate: 0.1, // 10% session replay
    replaysOnErrorSampleRate: 1.0, // 100% replay on error
  });
  console.log('✅ Sentry error tracking initialized (frontend)');
} else {
  console.warn('⚠️  VITE_SENTRY_DSN_FRONTEND not set - error tracking disabled');
}

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
          headers: {
            ...options?.headers,
            // Dev mode: bypass auth with test headers
            ...(import.meta.env.DEV && {
              'x-test-user-id': '1',
              'x-test-org-id': '3',
            }),
          },
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
            <ClientPortalAuthProvider>
              <AssistantProvider>
                <ChatbotProvider>
                  <App />
                </ChatbotProvider>
              </AssistantProvider>
            </ClientPortalAuthProvider>
          </AuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ThemeProvider>
  </React.StrictMode>,
)
