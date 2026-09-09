import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import { router } from '@/app/routes'
import { ThemeProvider } from '@/app/theme/theme-provider'
import './index.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element #root was not found in index.html')
}

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
)
