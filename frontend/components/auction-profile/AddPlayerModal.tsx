'use client';

import React, { useState, useEffect } from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import { getEffectiveForm, submitRegistrationForm, getStoredToken } from '@/lib/api';
import { Player, Team, FormField } from '@/types/auction';
import { DynamicFormRenderer } from '@/components/form-builder/DynamicFormRenderer';
import { AutoScrollText } from '@/components/ui';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: string;
  sport: string;
  defaultBasePrice: number;
  teams: Team[];
  onPlayerAdded: (player: Player) => void;
  auctionName?: string;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  isOpen,
  onClose,
  auctionId,
  sport,
  defaultBasePrice,
  teams,
  onPlayerAdded,
  auctionName,
}) => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formVersion, setFormVersion] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    async function loadFormDefinition() {
      try {
        setLoading(true);
        setError(null);
        setServerErrors({});

        // Resolve active published form definition for PLAYER_REGISTRATION
        const effective = await getEffectiveForm(auctionId, 'PLAYER_REGISTRATION');

        if (effective && effective.fields && effective.fields.length > 0) {
          setFields(effective.fields);
          setFormVersion(effective.version || 1);

          // Populate initial default values
          const initialValues: Record<string, any> = {};
          for (const f of effective.fields) {
            if (f.key === 'basePrice') initialValues[f.key] = defaultBasePrice;
            else if (f.key === 'sport') initialValues[f.key] = sport;
            else if (f.key === 'profileImage') {
              initialValues[f.key] = f.defaultValue || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';
            } else if (f.defaultValue !== undefined && f.defaultValue !== null) {
              initialValues[f.key] = f.defaultValue;
            }
          }
          setFormData(initialValues);
        } else {
          // Standard starter fields fallback
          setFields([
            { key: 'profileImage', label: 'Player Headshot / Passport Photo', type: 'image', required: true, visible: true, editable: true, order: 1, colSpan: 2 },
            { key: 'playerName', label: 'Player Full Name', type: 'text', required: true, visible: true, editable: true, order: 2, colSpan: 1 },
            { key: 'playerEmail', label: 'Email Address', type: 'email', required: true, visible: true, editable: true, order: 3, colSpan: 1 },
            { key: 'playerPhone', label: 'Contact Phone Number', type: 'phone', required: false, visible: true, editable: true, order: 4, colSpan: 1 },
            { key: 'role', label: 'Primary Playing Role', type: 'select', required: true, visible: true, editable: true, options: [{ label: 'Batsman', value: 'Batsman' }, { label: 'Bowler', value: 'Bowler' }, { label: 'All-Rounder', value: 'All-Rounder' }], order: 5, colSpan: 1 },
            { key: 'basePrice', label: 'Base Price (Starting Bid)', type: 'number', required: true, visible: true, editable: true, defaultValue: defaultBasePrice, order: 6, colSpan: 1 },
          ]);
          setFormData({
            basePrice: defaultBasePrice,
            sport,
            profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
          });
        }
      } catch (err: any) {
        console.error('Failed to load dynamic player registration form:', err);
        setError('Could not load dynamic form schema. Using standard configuration.');
      } finally {
        setLoading(false);
      }
    }

    loadFormDefinition();
  }, [isOpen, auctionId, sport, defaultBasePrice]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setServerErrors({});
      const token = getStoredToken() || '';

      const res: any = await submitRegistrationForm(
        auctionId,
        {
          formType: 'PLAYER_REGISTRATION',
          data: { ...formData, sport },
        },
        token
      );

      // Extract synced player record or construct player object
      let playerRecord: Player;
      if (res?.createdPlayer) {
        playerRecord = res.createdPlayer;
      } else {
        // Fallback extraction matching dynamic fields
        let extractedName = formData.playerName || formData.name || '';
        let extractedEmail = formData.playerEmail || formData.email || '';
        let extractedPhone = formData.playerPhone || formData.phone || '';
        let extractedRole = formData.role || formData.playerRole || 'Player';
        let extractedBasePrice = Number(formData.basePrice) || defaultBasePrice;
        let extractedImage = formData.profileImage || '';

        for (const f of fields) {
          const val = formData[f.key];
          if (val === undefined || val === null || val === '') continue;
          const kLower = (f.key || '').toLowerCase();
          const lLower = (f.label || '').toLowerCase();

          if (!extractedImage && (f.type === 'image' || kLower.includes('image') || lLower.includes('photo'))) {
            extractedImage = String(val);
          }
          if (!extractedEmail && (f.type === 'email' || kLower.includes('email') || lLower.includes('email'))) {
            extractedEmail = String(val).trim();
          }
          if (!extractedPhone && (f.type === 'phone' || kLower.includes('phone') || lLower.includes('phone') || lLower.includes('mobile'))) {
            extractedPhone = String(val).trim();
          }
          if (!extractedName && (kLower.includes('name') || lLower.includes('name') || f.order === 1)) {
            extractedName = String(val).trim();
          }
        }

        const finalName = extractedName || 'New Player';
        playerRecord = {
          _id: res?._id || `player_${Date.now()}`,
          auctionId,
          teamId: null,
          name: finalName,
          email: extractedEmail || `${finalName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}@auction.local`,
          phone: extractedPhone,
          profileImage: extractedImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
          sport,
          role: extractedRole,
          basePrice: extractedBasePrice,
          status: 'REGISTERED',
          customFields: formData,
        };
      }

      onPlayerAdded(playerRecord);
      onClose();
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        const errMap: Record<string, string> = {};
        for (const itm of err.errors) {
          errMap[itm.field] = itm.message;
        }
        setServerErrors(errMap);
        setError('Please correct the highlighted form errors before submitting.');
      } else {
        setError(err.message || 'Failed to submit player registration.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[540px] bg-[#02131b] border border-[#0d3f4f] rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#0d3f4f] shrink-0">
          <div className="min-w-0 flex-1 mr-2">
            <AutoScrollText
              text={auctionName ? `${auctionName} — Add New Player` : 'Add New Player'}
              className="text-sm sm:text-base font-mono font-medium text-white tracking-wide uppercase"
            />
            <p className="text-xs text-[#7fa3b0] mt-0.5 font-normal truncate">
              Register athlete credentials with tournament schema validation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7fa3b0] hover:text-white hover:bg-[#04202e] rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <IoCloseOutline size={22} />
          </button>
        </div>

        {error && (
          <div className="mt-2.5 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-normal text-red-400 shrink-0">
            {error}
          </div>
        )}

        {/* Dynamic Form Content with Smooth Auto-Scroll & No Horizontal Scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden mt-3 pt-1 pr-1.5 custom-scrollbar scroll-smooth">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#7fa3b0]">
              <div className="size-8 border-2 border-[#00d2ee] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono font-normal">Loading published player registration form...</span>
            </div>
          ) : (
            <form id="player-registration-form" onSubmit={handleSubmit} className="pr-0.5">
              <DynamicFormRenderer
                fields={fields}
                values={formData}
                errors={serverErrors}
                onChange={(key, val) => setFormData((prev) => ({ ...prev, [key]: val }))}
              />
            </form>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#0d3f4f] mt-3 shrink-0">
          <span className="text-[11px] font-mono font-normal text-[#7fa3b0]">
            * Person Name & 10-Digit Mobile verified.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-1.5 text-xs font-mono font-normal text-[#7fa3b0] hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="player-registration-form"
              disabled={submitting || loading}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-normal text-[#02131b] bg-[#00d2ee] hover:bg-[#00b8d4] disabled:opacity-50 rounded-xl transition-all shadow-sm cursor-pointer hover:shadow-[0_0_12px_rgba(0,210,238,0.3)] font-medium"
            >
              {submitting ? (
                <>
                  <span className="size-3.5 border-2 border-[#02131b] border-t-transparent rounded-full animate-spin" />
                  <span>Registering Player...</span>
                </>
              ) : (
                <span>Register Player</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
