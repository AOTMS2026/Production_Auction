'use client';

import React, { useState, useRef } from 'react';
import {
  Crop,
  Trash2,
  AlertCircle,
  Circle,
  Square,
  CheckCircle2,
  Camera,
  Pencil,
  ZoomIn,
} from 'lucide-react';
import { ImagePreviewDialog } from './ImagePreviewDialog';
import { ImageCropDialog } from './ImageCropDialog';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  fieldLabel: string;
  maxFileSizeMB?: number;
  allowedFormats?: string[];
  previewEnabled?: boolean;
  zoomEnabled?: boolean;
  cropEnabled?: boolean;
  defaultShape?: 'circle' | 'square';
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  disabled = false,
  fieldLabel,
  maxFileSizeMB = 5,
  allowedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  previewEnabled = true,
  zoomEnabled = true,
  cropEnabled = true,
  defaultShape = 'circle',
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [shape, setShape] = useState<'circle' | 'square'>(defaultShape);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    setError(null);

    // 1. Check format
    if (allowedFormats.length > 0 && !allowedFormats.includes(file.type)) {
      const readableFormats = allowedFormats.map((f) => f.replace('image/', '.')).join(', ');
      setError(`Invalid format. Allowed formats: ${readableFormats}`);
      return;
    }

    // 2. Check file size
    const maxBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File size exceeds maximum allowed ${maxFileSizeMB} MB limit.`);
      return;
    }

    // Convert to Data URL for instant preview / submission
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-[340px] mx-auto pt-1 pb-1">
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedFormats.join(',')}
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Centered Avatar / Photo Display */}
      <div className="relative group shrink-0 my-2">
        {value ? (
          <div
            onClick={() => {
              if (disabled) return;
              if (cropEnabled) setIsCropOpen(true);
              else fileInputRef.current?.click();
            }}
            className={`relative size-20 sm:size-24 overflow-hidden bg-[#011428] border-2 border-[#00d2ee] transition-all cursor-pointer ring-4 ring-[#00d2ee]/20 shadow-[0_0_18px_rgba(0,210,238,0.25)] hover:scale-105 ${
              shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
            }`}
            title="Click to Crop or Edit Photo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={fieldLabel} className="size-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
              <Crop className="size-4 text-[#00d2ee]" />
              <span className="text-[9px] font-mono mt-0.5 font-normal">Edit / Crop</span>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={`size-20 sm:size-24 bg-[#011428] border-2 border-dashed flex flex-col items-center justify-center text-[#00d2ee] transition-all cursor-pointer hover:scale-105 shadow-inner ${
              shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
            } ${
              isDragging
                ? 'border-[#00d2ee] bg-[#00d2ee]/15'
                : 'border-[#0d3f4f] hover:border-[#00d2ee] bg-[#031822]/60'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Click to Upload Photo"
          >
            <Camera className="size-6 text-[#00d2ee] mb-0.5 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-mono text-[#7fa3b0] group-hover:text-white">Upload</span>
          </div>
        )}

        {/* Floating Action Badge on Avatar */}
        {value ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={disabled}
            className="absolute -bottom-0.5 -right-0.5 size-6 rounded-full bg-[#00d2ee] hover:bg-[#00b8d4] text-[#02131b] border-2 border-[#02131b] shadow-md flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
            title="Change Photo File"
          >
            <Pencil className="size-3 text-[#02131b]" />
          </button>
        ) : null}
      </div>

      {/* Centered Label & Status */}
      <div className="mt-1 flex items-center justify-center gap-1.5 flex-wrap">
        <span className="text-xs font-mono font-medium text-white tracking-wide">
          {fieldLabel}
        </span>
        {value && (
          <span className="flex items-center gap-0.5 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="size-2.5" /> Ready
          </span>
        )}
      </div>

      {/* Centered Controls: Format switcher & Actions */}
      <div className="mt-1.5 flex items-center justify-center gap-2 flex-wrap">
        {/* Shape Switcher */}
        <div className="flex items-center gap-0.5 bg-[#010c12] border border-[#0d3f4f] rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setShape('circle')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
              shape === 'circle'
                ? 'bg-[#00d2ee] text-[#02131b] font-medium shadow-sm'
                : 'text-[#7fa3b0] hover:text-white'
            }`}
            title="Configure as Circular Profile / Headshot"
          >
            <Circle className="size-2.5" />
            <span>Circle</span>
          </button>
          <button
            type="button"
            onClick={() => setShape('square')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
              shape === 'square'
                ? 'bg-[#00d2ee] text-[#02131b] font-medium shadow-sm'
                : 'text-[#7fa3b0] hover:text-white'
            }`}
            title="Configure as Square Frame"
          >
            <Square className="size-2.5" />
            <span>Square</span>
          </button>
        </div>

        {/* Action Buttons */}
        {value ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="px-2 py-0.5 text-[10px] font-mono text-[#00d2ee] hover:text-white bg-[#00d2ee]/10 hover:bg-[#00d2ee]/20 border border-[#00d2ee]/30 rounded-lg transition-colors cursor-pointer"
            >
              Change
            </button>
            {cropEnabled && (
              <button
                type="button"
                onClick={() => setIsCropOpen(true)}
                disabled={disabled}
                className="px-2 py-0.5 text-[10px] font-mono text-[#7fa3b0] hover:text-white bg-[#031822] hover:bg-[#04202e] border border-[#0d3f4f] rounded-lg transition-colors cursor-pointer"
              >
                Crop
              </button>
            )}
            {previewEnabled && (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                disabled={disabled}
                className="p-1 text-[#7fa3b0] hover:text-[#00d2ee] hover:bg-[#04202e] rounded-lg transition-colors cursor-pointer"
                title="Inspect High-Res Photo"
              >
                <ZoomIn className="size-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled}
              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Remove photo"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="px-2.5 py-0.5 text-[10px] font-mono text-[#00d2ee] hover:text-white bg-[#00d2ee]/10 hover:bg-[#00d2ee]/20 border border-[#00d2ee]/30 rounded-lg transition-colors cursor-pointer"
          >
            Choose File
          </button>
        )}
      </div>

      {/* Helper file specification */}
      <span className="text-[10px] text-[#557b8c] font-mono mt-1">
        Max {maxFileSizeMB}MB • JPG, PNG, WEBP
      </span>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20 mt-1.5">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Image Zoom Inspection Dialog */}
      <ImagePreviewDialog
        isOpen={isPreviewOpen}
        imageUrl={value}
        title={`${fieldLabel} — High-Res Inspection`}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Image Crop Dialog */}
      <ImageCropDialog
        isOpen={isCropOpen}
        imageUrl={value}
        initialShape={shape}
        onClose={() => setIsCropOpen(false)}
        onCropComplete={(croppedUrl) => onChange(croppedUrl)}
      />
    </div>
  );
};
