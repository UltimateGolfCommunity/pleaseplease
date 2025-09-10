'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, CameraOff, AlertCircle, CheckCircle, X } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (data: any) => void;
  onClose: () => void;
  className?: string;
}

export default function QRCodeScanner({ onScan, onClose, className = '' }: QRCodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      setError(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this device');
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });

      setHasPermission(true);
      
      // Initialize QR code reader
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // Start scanning
      await reader.decodeFromVideoDevice(null, videoRef.current!, (result, error) => {
        if (result) {
          try {
            const qrData = JSON.parse(result.getText());
            onScan(qrData);
            stopScanning();
          } catch (parseError) {
            // If not JSON, create a simple connection object
            const qrData = {
              type: 'golf_connection',
              userId: result.getText().trim(),
              userName: 'QR Code User',
              timestamp: Date.now()
            };
            onScan(qrData);
            stopScanning();
          }
        }
        
        if (error && error.name !== 'NotFoundException') {
          console.error('QR scanning error:', error);
        }
      });

      setIsScanning(true);
      
      // Stop the stream after getting permission (we'll restart it with the reader)
      stream.getTracks().forEach(track => track.stop());
      
    } catch (err: any) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access to scan QR codes.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera access not supported on this device.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualInput = () => {
    if (!manualInput.trim()) return;

    try {
      // Try to parse as JSON first
      let qrData;
      try {
        qrData = JSON.parse(manualInput);
      } catch {
        // If not JSON, create a simple connection object
        qrData = {
          type: 'golf_connection',
          userId: manualInput.trim(),
          userName: 'Manual Entry',
          timestamp: Date.now()
        };
      }

      onScan(qrData);
    } catch (error) {
      setError('Invalid QR code data. Please check the format.');
    }
  };

  const simulateQRScan = () => {
    // For testing purposes - simulate scanning a QR code
    const mockData = {
      type: 'golf_connection',
      userId: 'test-user-123',
      userName: 'Test User',
      timestamp: Date.now()
    };
    onScan(mockData);
  };

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg mr-3">
              <Camera className="h-6 w-6 text-blue-400" />
            </div>
            Scan QR Code
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-slate-400" />
          </button>
        </div>

        {/* Camera Permission Request */}
        {hasPermission === null && !error && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Camera className="h-10 w-10 text-blue-400" />
            </div>
            <h4 className="text-xl font-bold text-white mb-4">Camera Access Required</h4>
            <p className="text-slate-400 mb-6">
              To scan QR codes, we need permission to access your camera. This allows you to quickly connect with other golfers.
            </p>
            <button
              onClick={requestCameraPermission}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2 mx-auto"
            >
              <Camera className="h-5 w-5" />
              <span>Allow Camera Access</span>
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <h4 className="text-xl font-bold text-white mb-4">Camera Access Failed</h4>
            <p className="text-slate-400 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setError(null);
                  setHasPermission(null);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
              <button
                onClick={() => setShowManualInput(true)}
                className="w-full bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                Use Manual Input
              </button>
            </div>
          </div>
        )}

        {/* Camera Scanner */}
        {hasPermission === true && isScanning && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '1/1' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute inset-0 border-2 border-blue-400 rounded-xl pointer-events-none">
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-400"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-400"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-400"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-400"></div>
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                Point camera at QR code
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={stopScanning}
                className="flex-1 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium flex items-center justify-center space-x-2"
              >
                <CameraOff className="h-4 w-4" />
                <span>Stop</span>
              </button>
              <button
                onClick={() => setShowManualInput(true)}
                className="flex-1 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 text-blue-400 border border-blue-400/30 px-4 py-2 rounded-lg hover:from-blue-500/30 hover:to-indigo-600/30 transition-all duration-300 font-medium"
              >
                Manual Input
              </button>
            </div>
          </div>
        )}

        {/* Manual Input */}
        {showManualInput && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white mb-2">Manual QR Code Input</h4>
              <p className="text-slate-400 text-sm">Enter QR code data or user ID manually</p>
            </div>
            
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Paste QR code data or user ID here..."
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-blue-500/10 resize-none"
              rows={4}
            />
            
            <div className="flex space-x-3">
              <button
                onClick={handleManualInput}
                disabled={!manualInput.trim()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-500 disabled:to-slate-600 text-white px-4 py-3 rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                Connect
              </button>
              <button
                onClick={simulateQRScan}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                Test Scan
              </button>
            </div>
            
            <button
              onClick={() => setShowManualInput(false)}
              className="w-full text-slate-400 hover:text-white transition-colors text-sm"
            >
              ← Back to Camera Scanner
            </button>
          </div>
        )}

        {/* Success State */}
        {hasPermission === true && !isScanning && !showManualInput && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h4 className="text-xl font-bold text-white mb-4">Camera Ready</h4>
            <p className="text-slate-400 mb-6">Camera access granted. Ready to scan QR codes!</p>
            <button
              onClick={requestCameraPermission}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2 mx-auto"
            >
              <Camera className="h-5 w-5" />
              <span>Start Scanning</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}