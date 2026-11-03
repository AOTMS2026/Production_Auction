'use client';

import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  RefreshCw,
  X,
} from 'lucide-react';

interface ImagePreviewDialogProps {
  isOpen: boolean;
  imageUrl: string;
  title?: string;
  onClose: () => void;
}

export const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = ({
  isOpen,
  imageUrl,
  title = 'Image Preview & Inspection',
  onClose,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleFit = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-[#02131b] border border-[#0d3f4f] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Action Controls */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#0d3f4f] bg-[#031822]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-mono font-medium text-white tracking-wide">{title}</h3>
            <span className="text-xs font-mono text-[#00d2ee] bg-[#00d2ee]/10 px-2 py-0.5 rounded border border-[#00d2ee]/30">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Zoom & Inspection Toolbar */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-[#04202e] border border-transparent hover:border-[#0d3f4f] transition-all"
              title="Zoom In (+)"
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-[#04202e] border border-transparent hover:border-[#0d3f4f] transition-all"
              title="Zoom Out (-)"
            >
              <ZoomOut className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-[#04202e] border border-transparent hover:border-[#0d3f4f] transition-all"
              title="Rotate 90°"
            >
              <RotateCw className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleFit}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-[#04202e] border border-transparent hover:border-[#0d3f4f] transition-all"
              title="Fit to Screen"
            >
              <Maximize2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-[#04202e] border border-transparent hover:border-[#0d3f4f] transition-all"
              title="Reset Zoom"
            >
              <RefreshCw className="size-4" />
            </button>
            <div className="w-px h-5 bg-[#0d3f4f] mx-1" />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Close Dialog"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas */}
        <div className="flex-1 min-h-[350px] max-h-[65vh] overflow-hidden flex items-center justify-center p-6 bg-[#010c12] relative cursor-grab active:cursor-grabbing select-none">
          <div
            className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Preview"
              className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-xl border border-[#0d3f4f]"
            />
          </div>
        </div>

        {/* Footer Notes */}
        <div className="px-5 py-2.5 border-t border-[#0d3f4f] bg-[#031822] flex items-center justify-between text-[11px] font-mono text-[#7fa3b0]">
          <span>Zoom: {Math.round(zoom * 100)}% • Rotation: {rotation}°</span>
          <span>Click anywhere outside or press Close to dismiss</span>
        </div>
      </div>
    </div>
  );
};
