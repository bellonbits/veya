import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import Home from './pages/Home'

const Platform = lazy(() => import('./pages/Platform'))
const Solutions = lazy(() => import('./pages/Solutions'))
const HowItWorks = lazy(() => import('./pages/HowItWorks'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Credits = lazy(() => import('./pages/Credits'))
import { appRoutes } from './app/routes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-svh bg-ink" />}>
        <Routes>
          {appRoutes}
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="platform" element={<Platform />} />
            <Route path="solutions" element={<Solutions />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="credits" element={<Credits />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
