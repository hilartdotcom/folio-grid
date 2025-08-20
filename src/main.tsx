import React from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import './index.css'

// Global runtime diagnostics – print errors to console AND screen
;(function attachErrorDiagnostics() {
  function show(msg: string) {
    const el = document.createElement('div')
    el.style.cssText = 'position:fixed;inset:auto 8px 8px auto;background:#fee2e2;color:#991b1b;padding:8px 10px;font:12px/1.2 ui-sans-serif,system-ui;border-radius:8px;max-width:60ch;z-index:99999;box-shadow:0 2px 10px rgba(0,0,0,.15)'
    el.textContent = `Runtime error: ${msg}`
    document.body.appendChild(el)
  }
  window.addEventListener('error', (e) => { console.error(e.error || e.message); show(String(e.error || e.message)) })
  window.addEventListener('unhandledrejection', (e:any) => { console.error('Unhandled:', e?.reason); show('Promise rejection: ' + String(e?.reason)) })
})()

// Remove the no-JS banner if JS booted
document.getElementById('no-js-banner')?.remove()

function Home() { return <div className="p-6">Hello — the app mounted.</div> }
function NotFound() { return <div className="p-6">404 — page not found.</div> }

// Defensive ErrorBoundary so we never get a blank screen after mount
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error?: Error}> {
  constructor(props:any){ super(props); this.state = { error: undefined } }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error:any, info:any){ console.error('App crashed:', error, info) }
  render(){
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

// Use HashRouter to avoid base-path issues in preview environments
const router = createHashRouter([
  { path: '/', element: <Home /> },
  { path: '*', element: <NotFound /> },
])

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element in index.html')

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>
)