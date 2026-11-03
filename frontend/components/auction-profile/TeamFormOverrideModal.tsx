'use client';

import React, { useState, useEffect } from 'react';
import { IoCloseOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { Team, FormField } from '@/types/auction';
import { getEffectiveForm, getTeamFormConfig, saveTeamFormConfig, getStoredToken } from '@/lib/api';

interface TeamFormOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: string;
  team: Team | null;
  onSaved?: () => void;
}

export const TeamFormOverrideModal: React.FC<TeamFormOverrideModalProps> = ({
  isOpen,
  onClose,
  auctionId,
  team,
  onSaved,
}) => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [overrides, setOverrides] = useState<Record<string, { visible?: boolean; required?: boolean }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !team) return;
    const currentTeam = team;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        // Fetch published team registration fields
        const effective = await getEffectiveForm(auctionId, 'TEAM_REGISTRATION');
        setFields(effective.fields || []);

        // Fetch team-specific overrides
        const config = await getTeamFormConfig(auctionId, currentTeam._id);
        setOverrides(config.overrides || {});
      } catch (err: any) {
        setError(err.message || 'Failed to load form configuration.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, auctionId, team]);

  if (!isOpen || !team) return null;

  const handleToggle = (fieldKey: string, prop: 'visible' | 'required') => {
    setOverrides((prev) => {
      const current = prev[fieldKey] || {};
      const baseField = fields.find((f) => f.key === fieldKey);
      const currentVal = current[prop] !== undefined ? current[prop] : baseField?.[prop];
      return {
        ...prev,
        [fieldKey]: {
          ...current,
          [prop]: !currentVal,
        },
      };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      const token = getStoredToken() || '';
      await saveTeamFormConfig(
        auctionId,
        team._id,
        { overrides },
        token
      );
      setSuccessMsg(`Customization overrides saved for ${team.name}!`);
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save team overrides.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#011428] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-white">Custom Form Overrides</h3>
              <span className="px-2 py-0.5 text-[11px] font-medium bg-[#0466c8]/20 text-[#87c2fd] border border-[#0466c8]/30 rounded">
                {team.name} ({team.code})
              </span>
            </div>
            <p className="text-xs font-normal text-white/50 mt-0.5">
              Customize visible fields and payment modes specifically for this franchise.
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-white/60 hover:text-white rounded-lg">
            <IoCloseOutline size={22} />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-normal text-red-400">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-normal text-emerald-400 flex items-center gap-2">
            <IoCheckmarkCircleOutline size={18} />
            {successMsg}
          </div>
        )}

        {/* Quick presets for Team A vs Team B scenarios */}
        <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-white/80">Quick Preset:</span>
            <span className="text-xs font-normal text-white/50 ml-1">Configure payment fields with one click</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setOverrides((prev) => ({
                  ...prev,
                  paymentMode: { visible: false, required: false },
                  paymentUpload: { visible: false, required: false },
                }));
              }}
              className="px-2.5 py-1 text-xs font-normal text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
            >
              Disable Payments (Team A)
            </button>
            <button
              type="button"
              onClick={() => {
                setOverrides((prev) => ({
                  ...prev,
                  paymentMode: { visible: true, required: true },
                  paymentUpload: { visible: true, required: true },
                }));
              }}
              className="px-2.5 py-1 text-xs font-normal text-[#87c2fd] hover:text-white bg-[#0466c8]/20 hover:bg-[#0466c8]/30 rounded-lg border border-[#0466c8]/30 transition-colors"
            >
              Enable Payments (Team B)
            </button>
          </div>
        </div>

        {/* Fields list */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-xs font-normal text-white/40">Loading fields...</div>
          ) : (
            fields.map((field) => {
              const currentOverride = overrides[field.key] || {};
              const isVisible =
                currentOverride.visible !== undefined ? currentOverride.visible : field.visible;
              const isRequired =
                currentOverride.required !== undefined ? currentOverride.required : field.required;

              return (
                <div
                  key={field.key}
                  className={`p-3 rounded-xl border transition-colors flex items-center justify-between ${
                    isVisible
                      ? 'bg-white/[0.02] border-white/10'
                      : 'bg-white/[0.005] border-white/5 opacity-60'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{field.label}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-normal bg-white/5 text-white/40 rounded">
                        {field.type}
                      </span>
                    </div>
                    <span className="text-xs font-normal text-white/40">Key: {field.key}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-normal text-white/70">
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => handleToggle(field.key, 'visible')}
                        className="w-4 h-4 rounded text-[#0466c8] bg-white/5 border-white/20"
                      />
                      <span>Visible</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 cursor-pointer text-xs font-normal ${
                        isVisible ? 'text-white/70' : 'text-white/30 pointer-events-none'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isRequired}
                        disabled={!isVisible}
                        onChange={() => handleToggle(field.key, 'required')}
                        className="w-4 h-4 rounded text-[#0466c8] bg-white/5 border-white/20"
                      />
                      <span>Required</span>
                    </label>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-normal text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 text-xs font-medium text-white bg-[#0466c8] hover:bg-[#0352a0] rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Overrides'}
          </button>
        </div>
      </div>
    </div>
  );
};
