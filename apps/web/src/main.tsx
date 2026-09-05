import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from './trpc'
import { App } from './App'
import './styles.css'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, retry: 1 } } })
const client = trpc.createClient({ links: [httpBatchLink({ url: '/api/trpc', headers() { const key = localStorage.getItem('mail-api-key'); return key ? { authorization: `Bearer ${key}` } : {} } })] })

ReactDOM.createRoot(document.getElementById('root')!).render(<trpc.Provider client={client} queryClient={queryClient}><QueryClientProvider client={queryClient}><App /></QueryClientProvider></trpc.Provider>)
