'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Eraser, Pen, RotateCcw, Save, X } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (signatureData: string, signatureName: string) => Promise<void>;
  onCancel: () => void;
  existingSignature?: {
    signature_data: string;
    signature_name: string;
  } | null;
  isEditing?: boolean;
}

export default function SignatureCanvas({ 
  onSave, 
  onCancel, 
  existingSignature, 
  isEditing = false 
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureName, setSignatureName] = useState(
    existingSignature?.signature_name || 'Ma signature'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration du canvas
    canvas.width = 400;
    canvas.height = 200;
    
    // Style du contexte
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Si on édite une signature existante, la charger
    if (isEditing && existingSignature?.signature_data) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setIsEmpty(false);
      };
      img.src = existingSignature.signature_data;
    }
  }, [isEditing, existingSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setIsEmpty(false);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Support tactile
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setIsEmpty(false);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) {
      toast({
        title: "❌ Signature vide",
        description: "Veuillez dessiner votre signature avant de sauvegarder.",
        variant: "destructive"
      });
      return;
    }

    if (!signatureName.trim()) {
      toast({
        title: "❌ Nom requis",
        description: "Veuillez donner un nom à votre signature.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      const signatureData = canvas.toDataURL('image/png');
      await onSave(signatureData, signatureName.trim());
    } catch (error) {
      console.error('Erreur sauvegarde signature:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de sauvegarder la signature.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Pen className="h-5 w-5 mr-2" />
          {isEditing ? 'Modifier ma signature' : 'Créer ma signature'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nom de la signature */}
        <div className="space-y-2">
          <Label htmlFor="signature-name">Nom de la signature</Label>
          <Input
            id="signature-name"
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            placeholder="Ex: Ma signature principale"
            maxLength={50}
          />
        </div>

        {/* Zone de signature */}
        <div className="space-y-4">
          <div className="text-center">
            <Label className="text-sm font-medium">
              Dessinez votre signature dans la zone ci-dessous
            </Label>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 rounded bg-white cursor-crosshair mx-auto block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawingTouch}
              onTouchMove={drawTouch}
              onTouchEnd={stopDrawing}
              style={{ touchAction: 'none' }}
            />
          </div>

          <div className="text-center text-sm text-gray-500">
            Utilisez votre souris ou votre doigt pour dessiner votre signature
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={clearCanvas}
            className="flex-1"
            disabled={isEmpty}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Effacer
          </Button>
          
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          
          <Button
            onClick={saveSignature}
            disabled={isEmpty || isSaving || !signatureName.trim()}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Mettre à jour' : 'Sauvegarder'}
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Conseils pour une bonne signature :</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Signez naturellement, comme sur papier</li>
            <li>• Utilisez des traits fluides et continus</li>
            <li>• Assurez-vous que votre signature soit lisible</li>
            <li>• Cette signature sera utilisée pour tous vos documents</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
