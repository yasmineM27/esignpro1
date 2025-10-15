"use client"

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Clock } from "lucide-react"

interface SessionIndicatorProps {
  className?: string
  showDetails?: boolean
}

export function SessionIndicator({ className = "", showDetails = false }: SessionIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [sessionStatus, setSessionStatus] = useState<'active' | 'expired' | 'checking'>('checking')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkSession = async () => {
    try {
      setSessionStatus('checking')
      
      // Essayer d'abord l'API agent-login
      let response = await fetch('/api/auth/agent-login', {
        method: 'GET',
        credentials: 'include'
      })

      let data = await response.json()

      // Si échec avec agent-login, essayer user-login
      if (!data.success) {
        response = await fetch('/api/auth/user-login', {
          method: 'GET',
          credentials: 'include'
        })
        data = await response.json()
      }

      setSessionStatus(data.success ? 'active' : 'expired')
      setLastCheck(new Date())
    } catch (error) {
      console.error('Erreur vérification session:', error)
      setSessionStatus('expired')
      setLastCheck(new Date())
    }
  }

  useEffect(() => {
    // Vérification initiale
    checkSession()

    // Vérification périodique (toutes les 2 minutes)
    const interval = setInterval(checkSession, 2 * 60 * 1000)

    // Vérification de la connexion internet
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Vérification lors du focus
    const handleFocus = () => {
      if (isOnline) {
        checkSession()
      }
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('focus', handleFocus)
    }
  }, [isOnline])

  const getStatusColor = () => {
    if (!isOnline) return 'destructive'
    if (sessionStatus === 'active') return 'default'
    if (sessionStatus === 'expired') return 'destructive'
    return 'secondary'
  }

  const getStatusText = () => {
    if (!isOnline) return 'Hors ligne'
    if (sessionStatus === 'active') return 'Session active'
    if (sessionStatus === 'expired') return 'Session expirée'
    return 'Vérification...'
  }

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />
    if (sessionStatus === 'active') return <Wifi className="h-3 w-3" />
    if (sessionStatus === 'expired') return <WifiOff className="h-3 w-3" />
    return <Clock className="h-3 w-3 animate-pulse" />
  }

  const formatLastCheck = () => {
    if (!lastCheck) return ''
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastCheck.getTime()) / 1000)
    
    if (diff < 60) return `il y a ${diff}s`
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
    return `il y a ${Math.floor(diff / 3600)}h`
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge variant={getStatusColor()} className="flex items-center space-x-1">
        {getStatusIcon()}
        <span className="text-xs">{getStatusText()}</span>
      </Badge>
      
      {showDetails && lastCheck && (
        <span className="text-xs text-gray-500">
          {formatLastCheck()}
        </span>
      )}
    </div>
  )
}
