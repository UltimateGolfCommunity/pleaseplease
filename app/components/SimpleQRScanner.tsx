'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SimpleQRScannerProps {
  onScan: (data: any) => void;
  onClose: () => void;
  className?: string;
}

export default function SimpleQRScanner({ onScan, onClose, className = '' }: SimpleQRScannerProps) {
  const [qrInput, setQrInput] = useState('');
  const { user } = useAuth();

  const handleManualInput = () => {
    if (!qrInput.trim()) return;

    try {
      // Try to parse as JSON first
      let qrData;
      try {
        qrData = JSON.parse(qrInput);
      } catch {
        // If not JSON, create a simple connection object
        qrData = {
          type: 'golf_connection',
          userId: qrInput.trim(),
          userName: 'Manual Entry',
          timestamp: Date.now()
        };
      }

      onScan(qrData);
    } catch (error) {
      alert('Invalid QR code data. Please check the format.');
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
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '1/1' }}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <p className="text-sm">Camera scanning not available</p>
                <p className="text-xs mt-1">Use manual input below</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manual QR Code Input
              </label>
              <textarea
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Paste QR code data or user ID here..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleManualInput}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={!qrInput.trim()}
          >
            Connect
          </button>
          <button
            onClick={simulateQRScan}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            Test Scan
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          Note: Camera scanning requires additional setup. Use manual input for now.
        </p>
      </div>
    </div>
  );
}
