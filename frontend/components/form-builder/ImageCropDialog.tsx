'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  X,
  Check,
  Circle,
  Square,
  Move,
} from 'lucide-react';

interface ImageCropDialogProps {
  isOpen: boolean;
  imageUrl: string;
  initialShape?: 'circle' | 'square';
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  isOpen,
  imageUrl,
  initialShape = 'circle',
  onClose,
  onCropComplete,
}) => {
  const [shape, setShape] = useState<'circle' | 'square'>(initialShape);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset transforms whenever modal opens with new image
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setShape(initialShape);
    }
  }, [isOpen, imageUrl, initialShape]);

  if (!isOpen || !imageUrl) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const executeCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const CROP_SIZE = 400; // Output dimension (400x400)
    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

    // Apply circular clipping path if circle shape is selected
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    // Translate to canvas center
    ctx.translate(CROP_SIZE / 2, CROP_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Scale calculation based on viewport to canvas ratio (view aperture is 260px)
    const ratio = CROP_SIZE / 260;
    ctx.translate(position.x * ratio, position.y * ratio);
    ctx.scale(scale * ratio, scale * ratio);

    // Draw the image centered
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;

    // Fit image base size into 260
    const baseFit = Math.min(260 / imgWidth, 260 / imgHeight);
    const drawWidth = imgWidth * baseFit;
    const drawHeight = imgHeight * baseFit;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    try {
      // Export high-res PNG (preserves transparency for circular avatar)
      const croppedDataUrl = canvas.toDataURL('image/png');
      onCropComplete(croppedDataUrl);
      onClose();
    } catch (err) {
      console.error('Canvas export error:', err);
      // Fallback: if tainted canvas from third-party URL, still pass original or close cleanly
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full bg-[#02131b] border border-[#0d3f4f] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#0d3f4f] bg-[#031822]">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-[#00d2ee]/15 border border-[#00d2ee]/30 flex items-center justify-center text-[#00d2ee]">
              <Crop className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-medium text-white tracking-wide">
                Crop & Frame Image
              </h3>
              <p className="text-[11px] text-[#7fa3b0]">Drag to reposition • Adjust zoom & rotation</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Shape Switcher (Circle vs Square) */}
            <div className="flex items-center bg-[#010e14] border border-[#0d3f4f] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setShape('circle')}
                className={`p-1.5 rounded-md text-xs font-mono transition-all ${
                  shape === 'circle'
                    ? 'bg-[#00d2ee] text-[#02131b] shadow-sm'
                    : 'text-[#7fa3b0] hover:text-white'
                }`}
                title="Circle Avatar Frame"
              >
                <Circle className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShape('square')}
                className={`p-1.5 rounded-md text-xs font-mono transition-all ${
                  shape === 'square'
                    ? 'bg-[#00d2ee] text-[#02131b] shadow-sm'
                    : 'text-[#7fa3b0] hover:text-white'
                }`}
                title="Square Card Frame"
              >
                <Square className="size-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#7fa3b0] hover:text-white hover:bg-[#04202e] rounded-lg transition-colors ml-1"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Crop Viewport with Guide Aperture */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative h-[340px] bg-[#010c12] overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        >
          {/* Target Transformable Image */}
          <div
            className="absolute transition-transform duration-75 ease-out pointer-events-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageUrl}
              crossOrigin="anonymous"
              alt="Crop Source"
              className="max-w-none max-h-none object-contain select-none"
              style={{ width: '260px', height: '260px', objectFit: 'contain' }}
              draggable={false}
            />
          </div>

          {/* Mask Overlay with Cutout */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Center aperture frame */}
            <div
              className={`size-[260px] border-2 border-[#00d2ee] shadow-[0_0_0_9999px_rgba(2,19,27,0.78)] transition-all relative ${
                shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
              }`}
            >
              {/* Subtle crosshair guides */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-px h-px bg-[#00d2ee]/20 pointer-events-none" />
              <div className="absolute inset-y-0 left-1/2 -translate-x-px w-px bg-[#00d2ee]/20 pointer-events-none" />
            </div>
          </div>

          {/* Quick Reposition Helper Hint */}
          <div className="absolute bottom-2.5 left-3 px-2 py-1 rounded bg-[#02131b]/80 border border-[#0d3f4f] flex items-center gap-1.5 text-[10px] font-mono text-[#7fa3b0] pointer-events-none">
            <Move className="size-3 text-[#00d2ee]" />
            <span>Click & drag to reposition</span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="p-4 bg-[#031822] border-t border-[#0d3f4f] space-y-3 font-mono text-xs">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScale((prev) => Math.max(prev - 0.2, 0.6))}
              className="p-1 rounded text-[#7fa3b0] hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="size-4" />
            </button>
            <input
              type="range"
              min="0.6"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-[#00d2ee] h-1.5 bg-[#010e14] rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setScale((prev) => Math.min(prev + 0.2, 3))}
              className="p-1 rounded text-[#7fa3b0] hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="size-4" />
            </button>
            <span className="w-12 text-right text-[11px] text-[#00d2ee]">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Secondary Action Toolbar & Apply Buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#010e14] hover:bg-[#04202e] border border-[#0d3f4f] text-[#7fa3b0] hover:text-white text-[11px] transition-colors"
                title="Rotate 90 degrees"
              >
                <RotateCw className="size-3.5" />
                <span>Rotate</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#010e14] hover:bg-[#04202e] border border-[#0d3f4f] text-[#7fa3b0] hover:text-white text-[11px] transition-colors"
                title="Reset Position"
              >
                <RefreshCw className="size-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs text-[#7fa3b0] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeCrop}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#00d2ee] hover:bg-[#00b8d4] text-[#02131b] font-medium text-xs shadow-sm transition-all cursor-pointer"
              >
                <Check className="size-4" />
                <span>Apply Crop</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
