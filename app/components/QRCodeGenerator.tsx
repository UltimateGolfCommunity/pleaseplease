'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  userId: string;
  userName: string;
  size?: number;
  className?: string;
}

export default function QRCodeGenerator({ 
  userId, 
  userName, 
  size = 200, 
  className = '' 
}: QRCodeGeneratorProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateQRCode();
  }, [userId]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Create a connection URL that includes user info
      const connectionData = {
        type: 'golf_connection',
        userId: userId,
        userName: userName,
        timestamp: Date.now()
      };
      
      const qrData = JSON.stringify(connectionData);
      
      // Generate QR code as data URL
      const qrDataURL = await QRCode.toDataURL(qrData, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodeDataURL(qrDataURL);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataURL) {
      const link = document.createElement('a');
      link.download = `golf-connection-${userName}-${userId}.png`;
      link.href = qrCodeDataURL;
      link.click();
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Generating QR Code...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center text-red-600 ${className}`}>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
        <img 
          src={qrCodeDataURL} 
          alt={`QR Code for ${userName}`}
          className="block"
          style={{ width: size, height: size }}
        />
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">
          Scan to connect with {userName}
        </p>
        <button
          onClick={downloadQRCode}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
        >
          Download QR Code
        </button>
      </div>
    </div>
  );
}
