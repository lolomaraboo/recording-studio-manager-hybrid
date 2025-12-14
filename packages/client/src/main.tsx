import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from './lib/trpc'
import { getStoredAccessToken } from './lib/auth'
import App from './App'
import './index.css'
// Initialize i18n
import './lib/i18n'

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
    httpBatchLink({
      url: 'http://localhost:3001/api/trpc',
      // Include credentials for cookies (refresh token)
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        })
      },
      headers() {
        const token = getStoredAccessToken()
        return token ? { Authorization: `Bearer ${token}` } : {}
      },
    }),
  ],
})

// Loading fallback for i18n
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    </Suspense>
  </React.StrictMode>,
)
