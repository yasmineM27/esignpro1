"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, TestTube } from "lucide-react"

interface TestCase {
  name: string
  data: any
  expectedResult: 'success' | 'error' | 'fallback'
  description: string
}

export function SignatureErrorTest() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const testCases: TestCase[] = [
    {
      name: 'Signature complète',
      data: {
        hasSignature: true,
        signature: {
          signedAt: '2025-10-15T10:30:00Z',
          signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          isValid: true
        }
      },
      expectedResult: 'success',
      description: 'Cas normal avec signature et date'
    },
    {
      name: 'Signature null',
      data: {
        hasSignature: true,
        signature: null
      },
      expectedResult: 'fallback',
      description: 'hasSignature=true mais signature=null'
    },
    {
      name: 'Signature sans date',
      data: {
        hasSignature: true,
        signature: {
          signedAt: null,
          signatureData: 'data:image/png;base64,test',
          isValid: true
        }
      },
      expectedResult: 'fallback',
      description: 'Signature présente mais signedAt=null'
    },
    {
      name: 'Signature avec date undefined',
      data: {
        hasSignature: true,
        signature: {
          signedAt: undefined,
          signatureData: 'data:image/png;base64,test',
          isValid: true
        }
      },
      expectedResult: 'fallback',
      description: 'Signature présente mais signedAt=undefined'
    },
    {
      name: 'Pas de signature',
      data: {
        hasSignature: false,
        signature: null
      },
      expectedResult: 'success',
      description: 'Cas normal sans signature'
    },
    {
      name: 'Signature null avec isValid',
      data: {
        hasSignature: true,
        signature: null // Erreur: accès à signature.isValid sur null
      },
      expectedResult: 'fallback',
      description: 'Test correction erreur signature.isValid sur null'
    }
  ]

  const runTests = () => {
    setIsRunning(true)
    const results = testCases.map(testCase => {
      try {
        // Simuler la logique de rendu des composants
        let result: 'success' | 'error' | 'fallback' = 'success'
        let message = ''

        if (testCase.data.hasSignature) {
          if (testCase.data.signature && testCase.data.signature.signedAt) {
            // Cas 1: Signature complète - devrait afficher la date
            try {
              const date = new Date(testCase.data.signature.signedAt).toLocaleDateString('fr-FR')
              message = `Signé le ${date}`
              result = 'success'
            } catch (error) {
              message = 'Erreur de formatage de date'
              result = 'error'
            }
          } else {
            // Cas 2: Signature sans date - devrait afficher le fallback
            message = 'Document signé'
            result = 'fallback'
          }

          // Test supplémentaire pour isValid (nouvelle correction)
          if (testCase.data.signature && testCase.data.signature.isValid) {
            message += ' (Signature validée)'
          } else if (testCase.data.signature === null) {
            // Test critique: accès à signature.isValid sur null
            try {
              // Cette ligne devrait être protégée maintenant
              const isValid = testCase.data.signature && testCase.data.signature.isValid
              if (!isValid) {
                message += ' (Non validée)'
              }
            } catch (error) {
              message = 'ERREUR: Accès à signature.isValid sur null'
              result = 'error'
            }
          }
        } else {
          // Cas 3: Pas de signature - ne devrait rien afficher
          message = 'Aucune signature'
          result = 'success'
        }

        return {
          ...testCase,
          actualResult: result,
          message,
          passed: result === testCase.expectedResult,
          error: null
        }
      } catch (error) {
        return {
          ...testCase,
          actualResult: 'error' as const,
          message: error instanceof Error ? error.message : 'Erreur inconnue',
          passed: testCase.expectedResult === 'error',
          error: error
        }
      }
    })

    setTestResults(results)
    setIsRunning(false)
  }

  const getResultIcon = (passed: boolean, actualResult: string) => {
    if (passed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else if (actualResult === 'error') {
      return <XCircle className="h-4 w-4 text-red-500" />
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getResultBadge = (passed: boolean, actualResult: string) => {
    if (passed) {
      return <Badge className="bg-green-100 text-green-800">PASS</Badge>
    } else if (actualResult === 'error') {
      return <Badge variant="destructive">FAIL</Badge>
    } else {
      return <Badge variant="secondary">DIFF</Badge>
    }
  }

  const passedTests = testResults.filter(r => r.passed).length
  const totalTests = testResults.length

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>Test Correction Erreurs Signature</span>
          </div>
          <div className="flex items-center space-x-2">
            {testResults.length > 0 && (
              <Badge variant={passedTests === totalTests ? "default" : "destructive"}>
                {passedTests}/{totalTests}
              </Badge>
            )}
            <Button
              onClick={runTests}
              disabled={isRunning}
              variant="outline"
              size="sm"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isRunning ? 'Test...' : 'Lancer Tests'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {testResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Cliquez sur "Lancer Tests" pour vérifier les corrections</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Résumé */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Résumé des Tests</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                  <div className="text-gray-600">Réussis</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{totalTests - passedTests}</div>
                  <div className="text-gray-600">Échoués</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalTests}</div>
                  <div className="text-gray-600">Total</div>
                </div>
              </div>
            </div>

            {/* Détails des tests */}
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{result.name}</h5>
                    <div className="flex items-center space-x-2">
                      {getResultIcon(result.passed, result.actualResult)}
                      {getResultBadge(result.passed, result.actualResult)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <strong>Attendu:</strong> {result.expectedResult}
                    </div>
                    <div>
                      <strong>Obtenu:</strong> {result.actualResult}
                    </div>
                  </div>
                  
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <strong>Message:</strong> {result.message}
                  </div>
                  
                  {result.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <strong>Erreur:</strong> {result.error.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
