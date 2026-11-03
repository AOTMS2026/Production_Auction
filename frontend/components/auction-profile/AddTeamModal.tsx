'use client';

import React, { useState, useEffect } from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import { getEffectiveForm, submitRegistrationForm, getStoredToken } from '@/lib/api';
import { Team, FormField } from '@/types/auction';
import { DynamicFormRenderer } from '@/components/form-builder/DynamicFormRenderer';
import { AutoScrollText } from '@/components/ui';

interface AddTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: string;
  defaultPurse: number;
  defaultMaxPlayers: number;
  onTeamAdded: (team: Team) => void;
  auctionName?: string;
  teamToEdit?: Team | null;
}

export const AddTeamModal: React.FC<AddTeamModalProps> = ({
  isOpen,
  onClose,
  auctionId,
  defaultPurse,
  defaultMaxPlayers,
  onTeamAdded,
  auctionName,
  teamToEdit,
}) => {
  const isEditing = Boolean(teamToEdit);
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

        // Resolve active published form definition for TEAM_REGISTRATION
        const effective = await getEffectiveForm(auctionId, 'TEAM_REGISTRATION');

        const DEFAULT_TEAM_LOGO = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200';

        let activeFields: FormField[] = (effective && effective.fields && effective.fields.length > 0)
          ? [...effective.fields]
          : [
              { key: 'teamLogo', label: 'Team Crest / Official Logo', type: 'image', required: false, visible: true, editable: true, order: 1, colSpan: 2, defaultValue: DEFAULT_TEAM_LOGO },
              { key: 'teamName', label: 'Team Name', type: 'text', required: true, visible: true, editable: true, order: 2, colSpan: 1 },
              { key: 'teamCode', label: 'Team Code (e.g. CSK)', type: 'text', required: true, visible: true, editable: true, order: 3, colSpan: 1 },
              { key: 'ownerName', label: 'Owner / Manager Name', type: 'text', required: false, visible: true, editable: true, order: 4, colSpan: 1 },
              { key: 'contactEmail', label: 'Contact Email', type: 'email', required: false, visible: true, editable: true, order: 5, colSpan: 1 },
              { key: 'purseTotal', label: 'Total Purse (Coins)', type: 'number', required: true, visible: true, editable: true, defaultValue: defaultPurse, order: 6, colSpan: 1 },
              { key: 'maxPlayers', label: 'Max Squad Size', type: 'number', required: true, visible: true, editable: true, defaultValue: defaultMaxPlayers, order: 7, colSpan: 1 },
            ];

        // Ensure Team Crest / Logo Starting Image is ALWAYS present at the top
        const hasImage = activeFields.some(
          (f) => f.type === 'image' || f.key === 'teamLogo' || f.key === 'logo'
        );
        if (!hasImage) {
          activeFields = [
            {
              key: 'teamLogo',
              label: 'Team Crest / Official Logo',
              type: 'image',
              required: false,
              visible: true,
              editable: true,
              order: 1,
              colSpan: 2,
              defaultValue: DEFAULT_TEAM_LOGO,
            },
            ...activeFields,
          ];
        }

        setFields(activeFields);
        setFormVersion(effective?.version || 1);

        if (teamToEdit) {
          // Pre-populate with existing team details
          const editValues: Record<string, any> = {
            teamName: teamToEdit.name || '',
            name: teamToEdit.name || '',
            teamCode: teamToEdit.code || teamToEdit.shortName || '',
            code: teamToEdit.code || teamToEdit.shortName || '',
            shortName: teamToEdit.shortName || teamToEdit.code || '',
            ownerName: teamToEdit.ownerName || '',
            contactEmail: teamToEdit.contactEmail || '',
            contactPhone: teamToEdit.contactPhone || '',
            purseTotal: teamToEdit.purseTotal ?? defaultPurse,
            maxPlayers: teamToEdit.maxPlayers ?? defaultMaxPlayers,
            teamLogo: teamToEdit.logo || DEFAULT_TEAM_LOGO,
            logo: teamToEdit.logo || DEFAULT_TEAM_LOGO,
          };

          // Fill any other fields from customFields if they match
          for (const f of activeFields) {
            if (editValues[f.key] === undefined) {
              const fromTeam = (teamToEdit as any)[f.key];
              if (fromTeam !== undefined && fromTeam !== null) {
                editValues[f.key] = fromTeam;
              } else if (f.defaultValue !== undefined && f.defaultValue !== null) {
                editValues[f.key] = f.defaultValue;
              }
            }
          }
          setFormData(editValues);
        } else {
          // Populate initial default values for new team with Starting Image
          const initialValues: Record<string, any> = {
            teamLogo: DEFAULT_TEAM_LOGO,
            logo: DEFAULT_TEAM_LOGO,
          };
          for (const f of activeFields) {
            if (f.key === 'purseTotal') initialValues[f.key] = defaultPurse;
            else if (f.key === 'maxPlayers') initialValues[f.key] = defaultMaxPlayers;
            else if (f.key === 'teamLogo' || f.key === 'logo') {
              initialValues[f.key] = f.defaultValue || DEFAULT_TEAM_LOGO;
            } else if (f.defaultValue !== undefined && f.defaultValue !== null) {
              initialValues[f.key] = f.defaultValue;
            }
          }
          setFormData(initialValues);
        }
      } catch (err: any) {
        console.error('Failed to load dynamic form for team registration:', err);
        setError('Could not load dynamic form schema. Using standard configuration.');
      } finally {
        setLoading(false);
      }
    }

    loadFormDefinition();
  }, [isOpen, auctionId, defaultPurse, defaultMaxPlayers, teamToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setServerErrors({});
      const token = getStoredToken() || '';

      const teamName = formData.teamName || formData.name || (teamToEdit?.name ?? 'New Team');
      const teamCode = (formData.teamCode || formData.code || formData.shortName || teamToEdit?.code || 'TM').toUpperCase();
      const teamLogo = formData.teamLogo || formData.logo || teamToEdit?.logo || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200';
      const purseTotalVal = Number(formData.purseTotal) || defaultPurse;
      const maxPlayersVal = Number(formData.maxPlayers) || defaultMaxPlayers;

      let updatedTeam: Team;

      if (teamToEdit) {
        // Direct team update using updateTeam API
        const { updateTeam } = await import('@/lib/api');
        updatedTeam = await updateTeam(
          auctionId,
          teamToEdit._id,
          {
            name: teamName,
            code: teamCode,
            shortName: teamCode,
            logo: teamLogo,
            purseTotal: purseTotalVal,
            maxPlayers: maxPlayersVal,
            ownerName: formData.ownerName || '',
            contactEmail: formData.contactEmail || '',
            contactPhone: formData.contactPhone || '',
            ...formData,
          },
          token
        );
      } else {
        // Submit payload to registration submissions engine
        const res: any = await submitRegistrationForm(
          auctionId,
          {
            formType: 'TEAM_REGISTRATION',
            data: formData,
          },
          token
        );

        updatedTeam = res?.createdTeam || {
          _id: res?._id || `team_${Date.now()}`,
          auctionId,
          name: teamName,
          code: teamCode,
          shortName: teamCode,
          ownerName: formData.ownerName || '',
          purseTotal: purseTotalVal,
          purseRemaining: purseTotalVal,
          maxPlayers: maxPlayersVal,
          logo: teamLogo,
        };
      }

      onTeamAdded(updatedTeam);
      onClose();
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        const errMap: Record<string, string> = {};
        for (const itm of err.errors) {
          errMap[itm.field] = itm.message;
        }
        setServerErrors(errMap);
        setError('Please correct the highlighted form errors before continuing.');
      } else {
        setError(err.message || 'Failed to submit team registration.');
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
            <div className="flex items-center gap-2 flex-wrap">
              <AutoScrollText
                text={
                  isEditing
                    ? (teamToEdit?.name ? `Edit Team — ${teamToEdit.name}` : 'Edit Franchise Team')
                    : (auctionName ? `${auctionName} — Add New Team` : 'Add New Team')
                }
                className="text-sm sm:text-base font-mono font-medium text-white tracking-wide uppercase"
              />
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-normal bg-[#00d2ee]/15 text-[#00d2ee] border border-[#00d2ee]/30 shrink-0">
                v{formVersion}
              </span>
            </div>
            <p className="text-xs text-[#7fa3b0] mt-0.5 font-normal truncate">
              {isEditing
                ? "Update franchise team details using tournament schema"
                : "Submit franchise team credentials and register squad"}
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
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden mt-3 pr-1.5 custom-scrollbar scroll-smooth">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#7fa3b0]">
              <div className="size-8 border-2 border-[#00d2ee] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono font-normal">Loading published team registration form...</span>
            </div>
          ) : (
            <form id="team-registration-form" onSubmit={handleSubmit} className="pr-0.5">
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
            * Mandatory fields verified by schema validation
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
              form="team-registration-form"
              disabled={submitting || loading}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-normal text-[#02131b] bg-[#00d2ee] hover:bg-[#00b8d4] disabled:opacity-50 rounded-xl transition-all shadow-sm cursor-pointer hover:shadow-[0_0_12px_rgba(0,210,238,0.3)] font-medium"
            >
              {submitting ? (
                <>
                  <span className="size-3.5 border-2 border-[#02131b] border-t-transparent rounded-full animate-spin" />
                  <span>{isEditing ? "Saving Changes..." : "Registering Team..."}</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Register Team"}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
