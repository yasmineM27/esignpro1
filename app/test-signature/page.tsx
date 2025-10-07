'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TestSignaturePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match display size without scaling
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Configuration du style de dessin
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = window.innerWidth < 768 ? 3 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // FIX: Precise coordinate calculation
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // FIX: Precise coordinate calculation
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Touch events for mobile - FIX: More precise coordinate calculation
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();

    // FIX: Precise coordinate calculation for mobile/tablet
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();

    // FIX: Precise coordinate calculation for mobile/tablet
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">
          ✍️ Test du Pad de Signature - eSignPro
        </h1>
        <p className="text-center text-gray-600">
          Cette page permet de tester que le pad de signature fonctionne correctement sans décalage entre la souris/doigt et le trait.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-green-600">🎯 Instructions de Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🖱️ Test Desktop (Souris)</h3>
              <p className="text-blue-700">Dessinez avec votre souris dans la zone de signature. Le trait doit apparaître exactement sous le curseur.</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">📱 Test Mobile (Tactile)</h3>
              <p className="text-green-700">Dessinez avec votre doigt sur l'écran tactile. Le trait doit apparaître exactement sous votre doigt.</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">✅ Résultat Attendu</h3>
              <p className="text-orange-700">Aucun décalage entre la position de la souris/doigt et le trait dessiné.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-purple-600">✍️ Zone de Signature</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full border-2 border-gray-300 bg-white hover:border-gray-400 rounded-lg touch-none"
                style={{
                  height: 'clamp(200px, 30vw, 300px)',
                  touchAction: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  cursor: 'crosshair'
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-400 text-sm text-center px-4">
                    <span className="hidden sm:inline">Signez ici avec votre souris ou votre doigt</span>
                    <span className="sm:hidden">Dessinez votre signature avec votre doigt</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={clearSignature}
                variant="outline"
                disabled={!hasSignature}
              >
                🗑️ Effacer
              </Button>
              <Button
                onClick={() => window.location.href = '/agent'}
                variant="outline"
              >
                ← Retour au Dashboard
              </Button>
            </div>

            {hasSignature && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-800 font-semibold">✅ Signature détectée !</p>
                <p className="text-green-600 text-sm">Si le trait suit parfaitement votre souris/doigt, le problème est résolu.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">🔧 Corrections Appliquées</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Suppression du scaling devicePixelRatio qui causait le décalage</p>
            <p>• Canvas dimensionné à la taille d'affichage réelle</p>
            <p>• Gestionnaires tactiles optimisés pour mobile</p>
            <p>• Prévention du scroll et des interactions par défaut</p>
          </div>
        </div>
      </div>
    </div>
  );
}
