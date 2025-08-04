// src/app/api-docs/page.tsx
'use client'

import { useEffect } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  useEffect(() => {
    // Add custom styles
    const style = document.createElement('style')
    style.textContent = `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin-bottom: 50px }
      .swagger-ui .info .title { color: #8B5CF6 }
      .swagger-ui .btn.authorize { background-color: #8B5CF6; border-color: #8B5CF6 }
      .swagger-ui .btn.authorize:hover { background-color: #7C3AED; border-color: #7C3AED }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Sparkle Universe API Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete API reference for developers
          </p>
        </div>
        <SwaggerUI 
          url="/api/openapi.json"
          docExpansion="list"
          defaultModelsExpandDepth={-1}
          displayRequestDuration={true}
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
          persistAuthorization={true}
        />
      </div>
    </div>
  )
}
