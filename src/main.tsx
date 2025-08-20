import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'

/** Minimal pages so / always renders something */
function Home() {
  return <div className="p-6">Hello 👋 — the app mounted.</div>
}
function NotFound() {
  return <div className="p-6">404 — page not found.</div>
}

/** Error boundary so you never get a blank screen */
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error?: Error}> {
  constructor(props: any) {
    super(props)
    this.state = { error: undefined }
  }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: any, info: any) { console.error('App crashed:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-red-600">
          <h1 className="text-xl font-semibold mb-2">Startup Error</h1>
          <pre className="whitespace-pre-wrap text-sm">{String(this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '*', element: <NotFound /> },
], {
  basename: import.meta.env.BASE_URL || '/',
})

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element in index.html')

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>
)