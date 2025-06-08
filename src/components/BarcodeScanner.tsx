import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { XIcon, CameraIcon } from "@phosphor-icons/react";
import { useInventory } from "../contexts/InventoryContext";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
}

export default function BarcodeScanner({ onClose, onBarcodeDetected }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { getInventoryByBarcode } = useInventory();

  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Use back camera for barcode scanning
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please ensure camera permissions are granted.");
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      await handleBarcodeDetected(manualBarcode.trim());
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    try {
      // First check if item exists in inventory
      const existingItem = await getInventoryByBarcode(barcode);
      
      if (existingItem) {
        toast.success(`Found: ${existingItem.name}`);
        onBarcodeDetected(barcode);
      } else {
        // Item not found, still pass the barcode for potential new item creation
        onBarcodeDetected(barcode);
      }
    } catch (error) {
      console.error("Error checking barcode:", error);
      onBarcodeDetected(barcode);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Barcode Scanner</h3>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Camera Section */}
          <div className="space-y-4">
            {!isScanning ? (
              <div className="text-center space-y-4">
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CameraIcon className="h-12 w-12 text-gray-400" />
                </div>
                <Button
                  onClick={startCamera}
                  className="w-full"
                >
                  <CameraIcon className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 border-2 border-red-500 border-dashed opacity-50 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                      Position barcode in frame
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="flex-1"
                  >
                    Stop Camera
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Manual Barcode Entry */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Or enter barcode manually:</h4>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!manualBarcode.trim()}
                >
                  Look Up Barcode
                </Button>
              </form>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">How to use:</p>
              <ul className="space-y-1 text-xs">
                <li>• Point camera at barcode for automatic scanning</li>
                <li>• Or manually enter the barcode number below</li>
                <li>• Existing items will be found automatically</li>
                <li>• New barcodes can be added to inventory</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}