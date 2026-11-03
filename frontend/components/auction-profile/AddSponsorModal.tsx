'use client';

import React, { useState } from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import { createSponsor, getStoredToken } from '@/lib/api';
import { Sponsor } from '@/types/auction';
import { Field, FieldLabel, FieldDescription, FieldGroup } from '@/components/ui/Form';

interface AddSponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: string;
  onSponsorAdded: (sponsor: Sponsor) => void;
}

export const AddSponsorModal: React.FC<AddSponsorModalProps> = ({
  isOpen,
  onClose,
  auctionId,
  onSponsorAdded,
}) => {
  const [name, setName] = useState('');
  const [tier, setTier] = useState<'TITLE' | 'POWERED_BY' | 'ASSOCIATE' | 'KIT' | 'MEDIA'>('TITLE');
  const [logo, setLogo] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Sponsor name is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = getStoredToken() || '';
      const newSponsor = await createSponsor(
        auctionId,
        {
          name: name.trim(),
          tier,
          logo: logo.trim(),
          website: website.trim(),
        },
        token
      );
      onSponsorAdded(newSponsor);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add sponsor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#011428] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div>
            <h3 className="text-lg font-medium text-white">Add Tournament Sponsor</h3>
            <p className="text-xs font-normal text-white/50">Partner logo & branding tier</p>
          </div>
          <button onClick={onClose} className="p-1 text-white/60 hover:text-white rounded-lg cursor-pointer">
            <IoCloseOutline size={22} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-normal text-red-400 shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col min-h-0 flex-1">
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
            <FieldGroup className="gap-4 pb-2">
              <Field>
                <FieldLabel htmlFor="sponsor-name">
                  Sponsor Brand Name <span className="text-rose-400 font-normal">*</span>
                </FieldLabel>
                <input
                  id="sponsor-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Red Bull Energy"
                  required
                  className="w-full px-3 py-2 text-xs font-normal text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#00d2ee] transition-all"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="sponsor-tier">Sponsorship Tier</FieldLabel>
                <select
                  id="sponsor-tier"
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-normal text-white bg-[#011428] border border-white/10 rounded-xl focus:outline-none focus:border-[#00d2ee] transition-all"
                >
                  <option value="TITLE">Title Sponsor</option>
                  <option value="POWERED_BY">Powered By Partner</option>
                  <option value="ASSOCIATE">Associate Sponsor</option>
                  <option value="KIT">Official Kit Sponsor</option>
                  <option value="MEDIA">Broadcast & Media Partner</option>
                </select>
              </Field>

              <Field>
                <FieldLabel htmlFor="sponsor-logo">Logo URL</FieldLabel>
                <input
                  id="sponsor-logo"
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs font-normal text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#00d2ee] transition-all"
                />
                <FieldDescription>Direct URL to image (PNG or SVG recommended)</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="sponsor-website">Official Website</FieldLabel>
                <input
                  id="sponsor-website"
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://sponsor.com"
                  className="w-full px-3 py-2 text-xs font-normal text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#00d2ee] transition-all"
                />
              </Field>
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10 mt-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-normal text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-medium text-white bg-[#0466c8] hover:bg-[#0352a0] rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Sponsor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
