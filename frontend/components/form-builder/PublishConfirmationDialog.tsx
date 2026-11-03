'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText,
  Users,
} from 'lucide-react';
import { FormField, FormType } from '@/types/auction';

interface PublishConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  auctionName: string;
  formType: FormType;
  teamName?: string;
  fields: FormField[];
  currentVersion: number;
}

export const PublishConfirmationDialog: React.FC<PublishConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  auctionName,
  formType,
  teamName,
  fields,
  currentVersion,
}) => {
  if (!isOpen) return null;

  const totalFields = fields.length;
  const requiredFields = fields.filter((f) => f.required && f.visible).length;
  const visibleFields = fields.filter((f) => f.visible).length;
  const newVersion = currentVersion + 1;

  // Validation summary items
  const nameFields = fields.filter(
    (f) =>
      f.validation?.allowedCharacters === 'PERSON_NAME' ||
      f.key.toLowerCase().includes('name')
  );
  const phoneFields = fields.filter(
    (f) => f.type === 'phone' || f.validation?.digitsOnly
  );
  const imageFields = fields.filter((f) => f.type === 'image');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-[#02131b] border border-[#0d3f4f] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#0d3f4f] bg-[#031822]">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-[#00d2ee]/10 border border-[#00d2ee]/30 flex items-center justify-center text-[#00d2ee]">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-medium text-white tracking-wide">
                Publish Form Version Confirmation
              </h3>
              <p className="text-[11px] text-[#7fa3b0]">
                Review release details before activating on live tournament registration.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#7fa3b0] hover:text-white rounded-lg transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs font-mono">
          {/* Version Increment Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#00d2ee]/10 border border-[#00d2ee]/30 text-white">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-[#00d2ee]" />
              <span>Schema Version Increment</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <span className="px-2 py-0.5 rounded bg-white/10 text-[#7fa3b0]">
                v{currentVersion} (Current)
              </span>
              <ArrowRight className="size-3.5 text-[#00d2ee]" />
              <span className="px-2 py-0.5 rounded bg-[#00d2ee] text-[#02131b] font-bold">
                v{newVersion} (Live Release)
              </span>
            </div>
          </div>

          {/* Scope and Meta Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#031822] border border-[#0d3f4f] space-y-1">
              <span className="text-[11px] text-[#7fa3b0] block">Auction Target:</span>
              <span className="text-white font-medium block truncate">{auctionName}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#031822] border border-[#0d3f4f] space-y-1">
              <span className="text-[11px] text-[#7fa3b0] block">Target Form Scope:</span>
              <span className="text-[#00d2ee] font-medium block truncate">
                {teamName ? `Team: ${teamName}` : formType === 'TEAM_REGISTRATION' ? 'All Franchise Teams' : 'All Players Pool'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#031822] border border-[#0d3f4f] space-y-1">
              <span className="text-[11px] text-[#7fa3b0] block">Total Configured Fields:</span>
              <span className="text-white font-medium block">
                {totalFields} Fields ({visibleFields} Active)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#031822] border border-[#0d3f4f] space-y-1">
              <span className="text-[11px] text-[#7fa3b0] block">Required Inputs:</span>
              <span className="text-amber-400 font-medium block">
                {requiredFields} Enforced Fields
              </span>
            </div>
          </div>

          {/* Validation Summary Highlights */}
          <div className="p-3.5 rounded-xl bg-[#011428] border border-[#0d3f4f] space-y-2">
            <span className="text-[11px] text-[#7fa3b0] uppercase tracking-wider block">
              Validation Rules Engine Summary
            </span>
            <ul className="space-y-1 text-[11px] text-white/80">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>
                  {nameFields.length} Person Name field(s) protected with letter-only validation.
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>
                  {phoneFields.length} Phone field(s) strictly requiring 10-digit mobile numbers.
                </span>
              </li>
              {imageFields.length > 0 && (
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {imageFields.length} Image field(s) with size limits & zoom inspection enabled.
                  </span>
                </li>
              )}
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>Previous versions remain preserved for historical submission data integrity.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#0d3f4f] bg-[#031822]">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-[#7fa3b0] hover:text-white hover:bg-[#04202e] rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono font-medium text-[#02131b] bg-[#00d2ee] hover:bg-[#00b8d4] disabled:opacity-50 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <span className="size-3.5 border-2 border-[#02131b] border-t-transparent rounded-full animate-spin" />
                <span>Publishing v{newVersion}...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                <span>Confirm & Publish v{newVersion}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
