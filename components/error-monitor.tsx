"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from "lucide-react"

interface ErrorLog {
  timestamp: string
  type: 'error' | 'warning' | 'success'
  message: string
  source?: string
}

export function ErrorMonitor() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Intercepter les erreurs console
  useEffect(() => {
    if (!isMonitoring) return

    const originalError = console.error
    const originalWarn = console.warn
    const originalLog = console.log

    console.error = (...args) => {
      const message = args.join(' ')
      if (message.includes('❌') || message.includes('Error') || message.includes('error')) {
        addError({
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          message: message.substring(0, 200),
          source: 'console.error'
        })
      }
      originalError.apply(console, args)
    }

    console.warn = (...args) => {
      const message = args.join(' ')
      if (message.includes('⚠️') || message.includes('Warning') || message.includes('warning')) {
        addError({
          timestamp: new Date().toLocaleTimeString(),
          type: 'warning',
          message: message.substring(0, 200),
          source: 'console.warn'
        })
      }
      originalWarn.apply(console, args)
    }

    console.log = (...args) => {
      const message = args.join(' ')
      if (message.includes('✅') || message.includes('Success') || message.includes('success')) {
        addError({
          timestamp: new Date().toLocaleTimeString(),
          type: 'success',
          message: message.substring(0, 200),
          source: 'console.log'
        })
      }
      originalLog.apply(console, args)
    }

    return () => {
      console.error = originalError
      console.warn = originalWarn
      console.log = originalLog
    }
  }, [isMonitoring])

  // Intercepter les erreurs globales
  useEffect(() => {
    if (!isMonitoring) return

    const handleError = (event: ErrorEvent) => {
      addError({
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        message: `${event.error?.message || event.message}`,
        source: event.filename || 'global'
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addError({
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        message: `Promise rejected: ${event.reason}`,
        source: 'promise'
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [isMonitoring])

  const addError = (error: ErrorLog) => {
    setErrors(prev => [error, ...prev.slice(0, 49)]) // Garder seulement les 50 dernières
  }

  const clearErrors = () => {
    setErrors([])
  }

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
    if (!isMonitoring) {
      addError({
        timestamp: new Date().toLocaleTimeString(),
        type: 'success',
        message: 'Monitoring des erreurs activé',
        source: 'monitor'
      })
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'secondary'
      case 'success':
        return 'default'
      default:
        return 'outline'
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden">
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Monitor d'Erreurs</span>
            <div className="flex items-center space-x-2">
              <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                {isMonitoring ? 'Actif' : 'Inactif'}
              </Badge>
              <Button
                onClick={toggleMonitoring}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-3 w-3 ${isMonitoring ? 'animate-pulse' : ''}`} />
              </Button>
              <Button
                onClick={clearErrors}
                variant="outline"
                size="sm"
              >
                Clear
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                variant="outline"
                size="sm"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 max-h-64 overflow-y-auto">
          {errors.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {isMonitoring ? 'Aucune erreur détectée' : 'Cliquez sur le bouton pour activer le monitoring'}
            </p>
          ) : (
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 rounded text-xs">
                  {getIcon(error.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={getBadgeVariant(error.type)} className="text-xs">
                        {error.type}
                      </Badge>
                      <span className="text-gray-500">{error.timestamp}</span>
                    </div>
                    <p className="text-gray-700 break-words">{error.message}</p>
                    {error.source && (
                      <p className="text-gray-500 mt-1">Source: {error.source}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
