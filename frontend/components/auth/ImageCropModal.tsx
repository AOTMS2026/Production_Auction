"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Check,
  Move,
  Maximize2,
  RefreshCw,
} from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}: ImageCropModalProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset adjustments whenever a new image opens
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  if (!isOpen) return null;

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

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
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

  // Export cropped circle image via canvas
  const handleApplyCrop = () => {
    const canvas = document.createElement("canvas");
    const cropSize = 400; // Output high-res 400x400 avatar
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext("2d");

    if (!ctx || !imageRef.current) {
      onCropComplete(imageSrc);
      onClose();
      return;
    }

    const img = imageRef.current;

    // Clear and prepare
    ctx.clearRect(0, 0, cropSize, cropSize);

    // Save context for transform operations
    ctx.save();

    // Center point in output canvas
    ctx.translate(cropSize / 2, cropSize / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Scaling ratio relative to modal preview frame (assume 260px preview frame)
    const previewSize = 260;
    const ratio = cropSize / previewSize;

    // Apply translation from pan
    ctx.translate(position.x * ratio, position.y * ratio);

    // Draw image centered with scale
    const drawWidth = (img.naturalWidth || 300) * scale * (cropSize / Math.max(img.naturalWidth, img.naturalHeight));
    const drawHeight = (img.naturalHeight || 300) * scale * (cropSize / Math.max(img.naturalWidth, img.naturalHeight));

    ctx.drawImage(
      img,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    // Export high-quality PNG data URL
    const croppedUrl = canvas.toDataURL("image/png", 0.92);
    onCropComplete(croppedUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
      <div className="relative w-full max-w-md rounded-3xl bg-[#001439] border border-[#023e7d] shadow-[0_0_50px_rgba(4,102,200,0.35)] p-6 text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#023e7d]/60 mb-5">
          <div className="flex items-center gap-2">
            <Maximize2 className="size-4.5 text-[#f97316]" />
            <h3 className="text-base font-normal text-white">
              Adjust & Crop Avatar
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#979dac] hover:text-white hover:bg-[#002855] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Viewport / Crop Box with Circular Mask */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative size-64 rounded-full overflow-hidden border-2 border-[#f97316] shadow-2xl bg-[#000d24] cursor-grab active:cursor-grabbing flex items-center justify-center select-none"
          >
            {/* Guide Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/10 z-10 opacity-30">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>

            {/* Target Image with Dynamic Scale & Rotation & Pan */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop Source"
              crossOrigin="anonymous"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging ? "none" : "transform 0.1s ease-out",
                maxWidth: "none",
                maxHeight: "none",
                width: "240px",
                height: "auto",
              }}
              className="pointer-events-none select-none object-contain"
            />
          </div>

          <p className="text-[11px] font-normal text-[#979dac] flex items-center gap-1.5">
            <Move className="size-3 text-[#87c2fd]" />
            <span>Click and drag image to pan & position</span>
          </p>
        </div>

        {/* Control Sliders & Buttons */}
        <div className="mt-5 space-y-4 pt-4 border-t border-[#023e7d]/50">
          {/* Zoom / Size Adjust Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-normal text-[#dee0e6]">
              <span className="flex items-center gap-1">
                <ZoomIn className="size-3.5 text-[#87c2fd]" />
                <span>Zoom & Size</span>
              </span>
              <span className="text-[#87c2fd] font-mono">{Math.round(scale * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <ZoomOut className="size-4 text-[#979dac]" />
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-[#0466c8] cursor-pointer"
              />
              <ZoomIn className="size-4 text-[#979dac]" />
            </div>
          </div>

          {/* Action Tools: Rotate, Reset */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleRotate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#001845] hover:bg-[#022950] border border-[#023e7d] text-xs font-normal text-[#dee0e6] transition-colors"
            >
              <RotateCw className="size-3.5 text-[#87c2fd]" />
              <span>Rotate 90°</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#001845] hover:bg-[#022950] border border-[#023e7d] text-xs font-normal text-[#979dac] hover:text-white transition-colors"
            >
              <RefreshCw className="size-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#023e7d] bg-[#001845]/80 hover:bg-[#022950] text-[#c3e0fe] text-xs font-normal transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0466c8] to-[#f97316] hover:opacity-95 text-white text-xs font-normal shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="size-4" />
              <span>Apply & Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
