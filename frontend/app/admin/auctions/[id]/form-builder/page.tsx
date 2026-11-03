'use client';

import React, { Suspense, useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  IoArrowBackOutline,
  IoSaveOutline,
  IoCloudUploadOutline,
  IoEyeOutline,
  IoTrashOutline,
  IoAddOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoLayersOutline,
  IoCardOutline,
  IoDocumentAttachOutline,
  IoCheckboxOutline,
  IoRadioButtonOnOutline,
  IoTextOutline,
  IoCallOutline,
  IoMailOutline,
  IoCalendarOutline,
  IoListOutline,
  IoImageOutline,
  IoAlertCircleOutline,
  IoSwapVerticalOutline,
  IoReorderFourOutline,
} from 'react-icons/io5';

import { FormField, FormTemplate, FormType } from '@/types/auction';
import {
  getCurrentFormTemplate,
  updateFormDraft,
  publishFormTemplate,
  getAuctionById,
  getStoredToken,
} from '@/lib/api';
import { DynamicFormRenderer } from '@/components/form-builder/DynamicFormRenderer';
import { PublishConfirmationDialog } from '@/components/form-builder/PublishConfirmationDialog';
import { AutoScrollText, ScrollArea, Separator } from '@/components/ui';

interface PageProps {
  params: Promise<{ id: string }>;
}

// 16 Field Palette definitions
const PALETTE_FIELDS: Array<{
  type: string;
  label: string;
  icon: any;
  category: 'Inputs' | 'Selection' | 'Files' | 'Payment' | 'Structure';
  defaultField: Partial<FormField>;
}> = [
  // Inputs
  {
    type: 'text',
    label: 'Short Text',
    icon: IoTextOutline,
    category: 'Inputs',
    defaultField: { label: 'Text Field', placeholder: 'Enter text...', type: 'text' },
  },
  {
    type: 'textarea',
    label: 'Long Text',
    icon: IoLayersOutline,
    category: 'Inputs',
    defaultField: { label: 'Description', placeholder: 'Enter details...', type: 'textarea' },
  },
  {
    type: 'number',
    label: 'Number',
    icon: IoTextOutline,
    category: 'Inputs',
    defaultField: { label: 'Numeric Value', placeholder: '0', type: 'number' },
  },
  {
    type: 'email',
    label: 'Email Address',
    icon: IoMailOutline,
    category: 'Inputs',
    defaultField: { label: 'Contact Email', placeholder: 'user@domain.com', type: 'email' },
  },
  {
    type: 'phone',
    label: 'Phone Number',
    icon: IoCallOutline,
    category: 'Inputs',
    defaultField: { label: 'Phone Number', placeholder: '+91 98765 43210', type: 'phone' },
  },
  {
    type: 'date',
    label: 'Date Picker',
    icon: IoCalendarOutline,
    category: 'Inputs',
    defaultField: { label: 'Date', type: 'date' },
  },

  // Selection
  {
    type: 'select',
    label: 'Dropdown Select',
    icon: IoListOutline,
    category: 'Selection',
    defaultField: {
      label: 'Select Option',
      type: 'select',
      options: [
        { label: 'Option A', value: 'optA' },
        { label: 'Option B', value: 'optB' },
      ],
    },
  },
  {
    type: 'radio',
    label: 'Radio Group',
    icon: IoRadioButtonOnOutline,
    category: 'Selection',
    defaultField: {
      label: 'Radio Choice',
      type: 'radio',
      options: [
        { label: 'Choice 1', value: 'c1' },
        { label: 'Choice 2', value: 'c2' },
      ],
    },
  },
  {
    type: 'checkbox',
    label: 'Single Checkbox',
    icon: IoCheckboxOutline,
    category: 'Selection',
    defaultField: { label: 'Agreement', type: 'checkbox' },
  },
  {
    type: 'multiselect',
    label: 'Multi-Select',
    icon: IoListOutline,
    category: 'Selection',
    defaultField: {
      label: 'Select Multiple',
      type: 'select',
      options: [
        { label: 'Tag 1', value: 'tag1' },
        { label: 'Tag 2', value: 'tag2' },
      ],
    },
  },

  // Files
  {
    type: 'file',
    label: 'Document Upload',
    icon: IoDocumentAttachOutline,
    category: 'Files',
    defaultField: {
      label: 'Upload Document',
      type: 'file',
      description: 'Accepted: PDF, PNG, JPG (Max 5MB)',
      validation: { maxFileSizeMb: 5 },
    },
  },
  {
    type: 'image',
    label: 'Image Upload',
    icon: IoImageOutline,
    category: 'Files',
    defaultField: {
      label: 'Upload Image',
      type: 'image',
      description: 'Square photo or franchise crest',
      validation: { maxFileSizeMb: 5 },
    },
  },

  // Payment
  {
    type: 'paymentMode',
    label: 'Payment Mode',
    icon: IoCardOutline,
    category: 'Payment',
    defaultField: {
      label: 'Registration Payment Method',
      type: 'paymentMode',
      options: [
        { label: 'UPI Instant Transfer', value: 'UPI' },
        { label: 'Direct Bank Wire (RTGS)', value: 'BANK_TRANSFER' },
        { label: 'Cash / Manual Receipt', value: 'CASH' },
      ],
    },
  },

  // Structure & Legal
  {
    type: 'section',
    label: 'Section Heading',
    icon: IoLayersOutline,
    category: 'Structure',
    defaultField: { label: 'New Section', type: 'section' },
  },
  {
    type: 'description',
    label: 'Information Note',
    icon: IoAlertCircleOutline,
    category: 'Structure',
    defaultField: { label: 'Important Notice', description: 'Guidelines...', type: 'section' },
  },
  {
    type: 'consent',
    label: 'Consent Declaration',
    icon: IoCheckboxOutline,
    category: 'Structure',
    defaultField: {
      label: 'I accept league terms and conditions',
      type: 'consent',
      required: true,
    },
  },
];

function FormBuilderContent({ id }: { id: string }) {
  const [auctionName, setAuctionName] = useState<string>('Auction');
  const [formType, setFormType] = useState<FormType>('TEAM_REGISTRATION');
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preview Mode state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);

  // Drag and drop state for canvas
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setStatusMsg(null);
        const token = getStoredToken() || '';

        const [aucRes, tpl] = await Promise.all([
          getAuctionById(id, token),
          getCurrentFormTemplate(id, formType, token),
        ]);

        if (aucRes.data) setAuctionName(aucRes.data.name);
        setTemplate(tpl);
        setFields(tpl.fields || []);
        if (tpl.fields?.length > 0) {
          setSelectedFieldKey(tpl.fields[0].key);
        }
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: err.message || 'Failed to load form template' });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, formType]);

  const selectedField = fields.find((f) => f.key === selectedFieldKey) || null;

  // Column width helper (2-Column Grid)
  const getFieldColSpan = (f: FormField): 1 | 2 => {
    if (f.colSpan === 2) return 2;
    if (f.colSpan === 1) return 1;
    if (f.type === 'section' || f.type === 'consent' || f.type === 'checkbox' || f.type === 'textarea') return 2;
    return 1;
  };

  const toggleFieldColSpan = (key: string) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.key !== key) return f;
        const current = getFieldColSpan(f);
        return { ...f, colSpan: current === 1 ? 2 : 1 };
      })
    );
  };

  // Helper to generate clean slug key
  const generateCleanKey = (label: string, type: string) => {
    const slug = label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const base = slug || type;
    const existingKeys = new Set(fields.map((f) => f.key));
    if (!existingKeys.has(base)) return base;
    let counter = 1;
    while (existingKeys.has(`${base}_${counter}`)) {
      counter++;
    }
    return `${base}_${counter}`;
  };

  // Add a field from the palette
  const handleAddField = (paletteItem: (typeof PALETTE_FIELDS)[0]) => {
    const label = paletteItem.defaultField.label || 'New Field';
    const cleanKey = generateCleanKey(label, paletteItem.type);
    const newField: FormField = {
      key: cleanKey,
      label,
      type: paletteItem.type,
      required: paletteItem.defaultField.required ?? false,
      visible: true,
      editable: true,
      placeholder: paletteItem.defaultField.placeholder || '',
      description: paletteItem.defaultField.description || '',
      defaultValue: paletteItem.defaultField.defaultValue || null,
      options: paletteItem.defaultField.options || [],
      validation: paletteItem.defaultField.validation || {},
      order: fields.length + 1,
      colSpan: (paletteItem.type === 'section' || paletteItem.type === 'consent' || paletteItem.type === 'textarea') ? 2 : 1,
    };

    const updated = [...fields, newField];
    setFields(updated);
    setSelectedFieldKey(newField.key);
  };

  // Drag and drop reorder function
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= fields.length ||
      toIndex >= fields.length
    ) {
      return;
    }

    const updated = [...fields];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    updated.forEach((f, idx) => (f.order = idx + 1));
    setFields(updated);
  };

  // Delete field
  const handleDeleteField = (key: string) => {
    const updated = fields.filter((f) => f.key !== key);
    updated.forEach((f, idx) => (f.order = idx + 1));
    setFields(updated);
    if (selectedFieldKey === key) {
      setSelectedFieldKey(updated[0]?.key || null);
    }
  };

  // Update selected field settings
  const handleUpdateSelectedField = (updates: Partial<FormField>) => {
    if (!selectedFieldKey) return;
    if (updates.key && updates.key !== selectedFieldKey) {
      const sanitizedKey = updates.key.replace(/[^a-zA-Z0-9_]/g, '_');
      updates.key = sanitizedKey;
      setSelectedFieldKey(sanitizedKey);
    }
    setFields((prev) =>
      prev.map((f) => (f.key === selectedFieldKey ? { ...f, ...updates } : f))
    );
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!template) return;
    try {
      setSaving(true);
      setStatusMsg(null);
      const token = getStoredToken() || '';
      const updated = await updateFormDraft(
        id,
        template._id,
        { fields, name: template.name },
        token
      );
      setTemplate(updated);
      setStatusMsg({ type: 'success', text: 'Form draft saved successfully with updated positions.' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save draft' });
    } finally {
      setSaving(false);
    }
  };

  // Publish Template Version
  const handlePublish = async () => {
    if (!template) return;
    try {
      setPublishing(true);
      setStatusMsg(null);
      const token = getStoredToken() || '';
      // Save draft first
      await updateFormDraft(id, template._id, { fields }, token);
      const published = await publishFormTemplate(id, template._id, token);
      setTemplate(published);
      setIsPublishConfirmOpen(false);
      setStatusMsg({
        type: 'success',
        text: `Template published successfully as version ${published.version}!`,
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to publish version' });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#02131b] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#00d2ee] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-mono text-[#7fa3b0]">Loading form builder...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02131b] text-white flex flex-col relative selection:bg-[#00d2ee]/30 selection:text-white">
      {/* Stadium Background Atmosphere */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <Image
          src="/stadium-band.jpg"
          alt="Stadium Floodlights"
          fill
          priority
          className="object-cover object-center filter saturate-150 brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02131b]/90 via-[#02141d]/95 to-[#021016]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="px-4 sm:px-8 py-3.5 border-b border-[#0d3f4f] backdrop-blur-xl bg-[#02131b]/95 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href={`/auctions/${id}`}
              className="p-1.5 text-[#7fa3b0] hover:text-[#00d2ee] hover:bg-[#031d27] rounded-lg transition-colors"
              title="Back to Auction"
            >
              <IoArrowBackOutline size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-mono font-medium text-white uppercase tracking-wider">
                  Dynamic Form Builder
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-[#00d2ee]/15 text-[#00d2ee] border border-[#00d2ee]/30 rounded">
                  v{template?.version || 1} ({template?.status || 'DRAFT'})
                </span>
              </div>
              <p className="text-xs text-[#7fa3b0] font-mono truncate max-w-xs sm:max-w-md">{auctionName}</p>
            </div>
          </div>

          {/* Form Type Switcher */}
          <div className="flex items-center bg-[#031d27] border border-[#0d3f4f] rounded-xl p-1">
            <button
              onClick={() => setFormType('TEAM_REGISTRATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                formType === 'TEAM_REGISTRATION'
                  ? 'bg-[#00d2ee] text-[#02131b] shadow-sm'
                  : 'text-[#7fa3b0] hover:text-white'
              }`}
            >
              Team Registration
            </button>
            <button
              onClick={() => setFormType('PLAYER_REGISTRATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                formType === 'PLAYER_REGISTRATION'
                  ? 'bg-[#00d2ee] text-[#02131b] shadow-sm'
                  : 'text-[#7fa3b0] hover:text-white'
              }`}
            >
              Player Registration
            </button>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">

            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium text-white/80 hover:text-white bg-[#031d27] hover:bg-[#052735] border border-[#0d3f4f] rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              <IoSaveOutline size={15} />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              onClick={() => setIsPublishConfirmOpen(true)}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <IoCloudUploadOutline size={16} />
              <span>{publishing ? 'Publishing...' : 'Publish Form'}</span>
            </button>
          </div>
        </header>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-mono text-center flex items-center justify-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border-b border-red-500/30'
            }`}
          >
            {statusMsg.type === 'success' ? <IoCheckmarkCircleOutline size={16} /> : <IoAlertCircleOutline size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* 3-Panel Form Builder Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* ================= PANEL 1: AVAILABLE FIELDS PALETTE ================= */}
          <aside className="w-64 border-r border-[#0d3f4f] bg-[#02131b]/90 backdrop-blur-xl p-4 overflow-y-auto space-y-5">
            <div>
              <h3 className="text-xs font-mono font-medium text-white uppercase tracking-wider">Field Palette</h3>
              <p className="text-[11px] text-[#7fa3b0]">Click controls to append to canvas</p>
            </div>

            {(['Inputs', 'Selection', 'Files', 'Payment', 'Structure'] as const).map((cat) => (
              <div key={cat} className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#00d2ee] block">
                  {cat}
                </span>
                <div className="space-y-1">
                  {PALETTE_FIELDS.filter((p) => p.category === cat).map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.type}
                        onClick={() => handleAddField(p)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:text-white bg-[#031d27]/70 hover:bg-[#052735] border border-[#0d3f4f]/60 hover:border-[#00d2ee]/50 transition-all text-left cursor-pointer group"
                      >
                        <Icon size={15} className="text-[#00d2ee] flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span>{p.label}</span>
                        <IoAddOutline size={14} className="ml-auto text-[#7fa3b0] group-hover:text-[#00d2ee]" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </aside>

          {/* ================= PANEL 2: FORM CANVAS ================= */}
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#010e14]/70 flex justify-center">
            <div className="w-full max-w-4xl space-y-4">
              {/* Canvas Header with Title, Count, 2-Column Grid Badge, and Small Preview Mode Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#0d3f4f] gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-mono font-medium text-white uppercase tracking-wider">
                      {formType === 'TEAM_REGISTRATION' ? 'Team Registration Fields' : 'Player Registration Fields'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#00d2ee]/15 text-[#00d2ee] border border-[#00d2ee]/30 font-medium">
                      {fields.length} Fields
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#031d27] text-[#00d2ee] border border-[#00d2ee]/30 font-medium">
                      2-Column Form
                    </span>
                  </div>
                  <p className="text-xs text-[#7fa3b0]">Drag and drop cards to change position • Customize column width (1 or 2 cols)</p>
                </div>

                {/* Small Button Added: Preview Mode */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewValues({});
                      setIsPreviewOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-[#00d2ee] bg-[#00d2ee]/10 hover:bg-[#00d2ee]/20 border border-[#00d2ee]/40 transition-all shadow-sm cursor-pointer hover:shadow-[0_0_12px_rgba(0,210,238,0.25)]"
                    title="Open Form Preview Mode"
                  >
                    <IoEyeOutline size={15} />
                    <span>Preview Mode</span>
                  </button>
                </div>
              </div>

              {fields.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-[#0d3f4f] text-[#7fa3b0] text-xs space-y-2">
                  <p>No dynamic fields on canvas yet.</p>
                  <p className="text-[11px] text-[#7fa3b0]/70">Click controls in the Field Palette on the left to add questions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {fields.map((field, idx) => {
                    const isSelected = selectedFieldKey === field.key;
                    const span = getFieldColSpan(field);
                    const colSpanClass = span === 2 ? 'col-span-1 md:col-span-2' : 'col-span-1';
                    const isDragging = draggedIndex === idx;
                    const isOver = dragOverIndex === idx;

                    return (
                      <div
                        key={field.key}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', String(idx));
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedIndex(idx);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          setDragOverIndex(idx);
                        }}
                        onDragLeave={() => {
                          if (dragOverIndex === idx) setDragOverIndex(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const sourceIdx = draggedIndex ?? Number(e.dataTransfer.getData('text/plain'));
                          handleReorder(sourceIdx, idx);
                          setDraggedIndex(null);
                          setDragOverIndex(null);
                        }}
                        onDragEnd={() => {
                          setDraggedIndex(null);
                          setDragOverIndex(null);
                        }}
                        onClick={() => setSelectedFieldKey(field.key)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${colSpanClass} ${
                          isSelected
                            ? 'bg-[#031d27] border-[#00d2ee] shadow-[0_0_20px_rgba(0,210,238,0.2)]'
                            : 'bg-[#021822]/90 hover:bg-[#031d27] border-[#0d3f4f] hover:border-[#00d2ee]/50'
                        } ${isDragging ? 'opacity-30 border-dashed border-[#00d2ee] scale-[0.98]' : ''} ${
                          isOver
                            ? 'border-[#00d2ee] ring-2 ring-[#00d2ee]/60 bg-[#00d2ee]/15 shadow-[0_0_20px_rgba(0,210,238,0.3)]'
                            : ''
                        }`}
                      >
                        {/* Top row: Drag Handle, Badge, Label, and Quick Column Toggle */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Drag Handle */}
                            <div
                              className="cursor-grab active:cursor-grabbing text-[#7fa3b0] hover:text-[#00d2ee] p-1 -ml-1 rounded transition-colors"
                              title="Drag to change position"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IoReorderFourOutline size={20} />
                            </div>

                            {/* Position Badge */}
                            <div className="size-6 rounded-lg bg-[#00d2ee]/15 border border-[#00d2ee]/30 text-[#00d2ee] font-mono text-[11px] font-medium flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </div>

                            {/* Label & Badges */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[140px] sm:max-w-[200px]">
                                  {field.label}
                                </span>
                                {field.required && (
                                  <span className="text-rose-400 text-[10px] font-mono font-medium">*Req</span>
                                )}
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/5 text-[#7fa3b0] border border-white/10">
                                  {field.type}
                                </span>
                                {field.conditionalRule && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                    Cond
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Quick Column Width Switcher and Delete */}
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => toggleFieldColSpan(field.key)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold border transition-all cursor-pointer ${
                                span === 2
                                  ? 'bg-[#00d2ee]/20 text-[#00d2ee] border-[#00d2ee]/50'
                                  : 'bg-white/5 text-[#7fa3b0] border-white/10 hover:text-white'
                              }`}
                              title="Toggle column width: 1 Column (Half) vs 2 Columns (Full)"
                            >
                              {span === 2 ? '2 Col (Full)' : '1 Col (Half)'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteField(field.key)}
                              className="p-1 text-[#7fa3b0] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete Field"
                            >
                              <IoTrashOutline size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Subtext info */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#7fa3b0]/70 mt-2.5 pt-2 border-t border-[#0d3f4f]/40">
                          <span>Key: {field.key}</span>
                          <span className="text-[#00d2ee]/80">Pos #{idx + 1} of {fields.length}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          {/* ================= PANEL 3: FIELD SETTINGS INSPECTOR ================= */}
          <aside className="w-80 border-l border-[#0d3f4f] bg-[#02131b]/90 backdrop-blur-xl p-5 overflow-y-auto space-y-5">
            <div>
              <h3 className="text-xs font-mono font-medium text-white uppercase tracking-wider">Field Settings</h3>
              <p className="text-[11px] text-[#7fa3b0]">Configure selected field properties</p>
            </div>

            {selectedField ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">Field Label</label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => handleUpdateSelectedField({ label: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-normal text-white bg-[#031d27] border border-[#0d3f4f] rounded-lg focus:outline-none focus:border-[#00d2ee]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">Field Key (Unique ID)</label>
                  <input
                    type="text"
                    value={selectedField.key}
                    onChange={(e) => handleUpdateSelectedField({ key: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono text-white bg-[#031d27] border border-[#0d3f4f] rounded-lg focus:outline-none focus:border-[#00d2ee]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={(e) => handleUpdateSelectedField({ placeholder: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-normal text-white bg-[#031d27] border border-[#0d3f4f] rounded-lg focus:outline-none focus:border-[#00d2ee]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">Description / Subtext</label>
                  <input
                    type="text"
                    value={selectedField.description || ''}
                    onChange={(e) => handleUpdateSelectedField({ description: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-normal text-white bg-[#031d27] border border-[#0d3f4f] rounded-lg focus:outline-none focus:border-[#00d2ee]"
                  />
                </div>

                {/* Toggles */}
                <div className="pt-2 border-t border-[#0d3f4f] space-y-2">
                  <label className="flex items-center justify-between text-xs font-normal text-white/80 cursor-pointer">
                    <span>Mandatory Field (Required)</span>
                    <input
                      type="checkbox"
                      checked={!!selectedField.required}
                      onChange={(e) => handleUpdateSelectedField({ required: e.target.checked })}
                      className="w-4 h-4 rounded text-[#00d2ee] bg-[#031d27] border-[#0d3f4f]"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-normal text-white/80 cursor-pointer">
                    <span>Visible in Form</span>
                    <input
                      type="checkbox"
                      checked={selectedField.visible !== false}
                      onChange={(e) => handleUpdateSelectedField({ visible: e.target.checked })}
                      className="w-4 h-4 rounded text-[#00d2ee] bg-[#031d27] border-[#0d3f4f]"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-normal text-white/80 cursor-pointer">
                    <span>Editable by Applicant</span>
                    <input
                      type="checkbox"
                      checked={selectedField.editable !== false}
                      onChange={(e) => handleUpdateSelectedField({ editable: e.target.checked })}
                      className="w-4 h-4 rounded text-[#00d2ee] bg-[#031d27] border-[#0d3f4f]"
                    />
                  </label>
                </div>

                {/* Column Width Configuration (2-Column Form) */}
                <div className="pt-3 border-t border-[#0d3f4f] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-white/80">Column Width</span>
                    <span className="text-[10px] font-mono text-[#00d2ee]">2-Col Grid</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateSelectedField({ colSpan: 1 })}
                      className={`py-2 px-2.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                        getFieldColSpan(selectedField) === 1
                          ? 'bg-[#00d2ee]/20 text-[#00d2ee] border-[#00d2ee] shadow-[0_0_12px_rgba(0,210,238,0.2)]'
                          : 'bg-[#031d27] text-[#7fa3b0] border-[#0d3f4f] hover:text-white'
                      }`}
                    >
                      1 Col (Half Width)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateSelectedField({ colSpan: 2 })}
                      className={`py-2 px-2.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                        getFieldColSpan(selectedField) === 2
                          ? 'bg-[#00d2ee]/20 text-[#00d2ee] border-[#00d2ee] shadow-[0_0_12px_rgba(0,210,238,0.2)]'
                          : 'bg-[#031d27] text-[#7fa3b0] border-[#0d3f4f] hover:text-white'
                      }`}
                    >
                      2 Col (Full Width)
                    </button>
                  </div>
                </div>

                {/* Options Editor */}
                {selectedField.options && (
                  <div className="pt-3 border-t border-[#0d3f4f] space-y-2">
                    <span className="text-xs font-mono font-medium text-white/70 block">Choices / Options</span>
                    <div className="space-y-1.5">
                      {selectedField.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const newOpts = [...(selectedField.options || [])];
                              newOpts[oIdx] = { ...opt, label: e.target.value };
                              handleUpdateSelectedField({ options: newOpts });
                            }}
                            className="flex-1 px-2.5 py-1 text-xs font-normal text-white bg-[#031d27] border border-[#0d3f4f] rounded"
                            placeholder="Option Label"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = selectedField.options?.filter((_, i) => i !== oIdx);
                              handleUpdateSelectedField({ options: newOpts });
                            }}
                            className="p-1 text-white/40 hover:text-red-400"
                          >
                            <IoCloseOutline size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = [
                            ...(selectedField.options || []),
                            { label: `Option ${(selectedField.options?.length || 0) + 1}`, value: `opt_${Date.now()}` },
                          ];
                          handleUpdateSelectedField({ options: newOpts });
                        }}
                        className="text-xs font-mono text-[#00d2ee] hover:underline flex items-center gap-1 pt-1"
                      >
                        <IoAddOutline size={14} /> Add Choice
                      </button>
                    </div>
                  </div>
                )}

                {/* Dynamic Validation Rules Section */}
                <div className="pt-3 border-t border-[#0d3f4f] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-white/80 block">
                      Validation Rules ({selectedField.type.toUpperCase()})
                    </span>
                    <span className="text-[10px] font-mono text-[#00d2ee]">Strict Engine</span>
                  </div>

                  {/* 1. Text / String Specific Rules */}
                  {(selectedField.type === 'text' || selectedField.type === 'textarea') && (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-mono text-[#7fa3b0] mb-1">
                          Permitted Character Policy
                        </label>
                        <select
                          value={selectedField.validation?.allowedCharacters || 'ANY'}
                          onChange={(e) =>
                            handleUpdateSelectedField({
                              validation: {
                                ...selectedField.validation,
                                allowedCharacters: e.target.value as any,
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs text-white bg-[#031d27] border border-[#0d3f4f] rounded-lg"
                        >
                          <option value="ANY">Any Standard Characters</option>
                          <option value="PERSON_NAME">
                            Person Name Only (Letters, Spaces, Hyphens, Dots)
                          </option>
                          <option value="ALPHANUMERIC">Alphanumeric (Letters & Numbers)</option>
                        </select>
                        {selectedField.validation?.allowedCharacters === 'PERSON_NAME' && (
                          <p className="text-[10px] text-[#00d2ee] mt-1">
                            Enforces real names (e.g. Jayaveer, Ravi Kumar). Rejects numbers like Jay123.
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-mono text-[#7fa3b0] mb-1">Min Length</label>
                          <input
                            type="number"
                            value={selectedField.validation?.minLength ?? ''}
                            onChange={(e) =>
                              handleUpdateSelectedField({
                                validation: {
                                  ...selectedField.validation,
                                  minLength: e.target.value ? Number(e.target.value) : undefined,
                                },
                              })
                            }
                            placeholder="e.g. 2"
                            className="w-full px-2.5 py-1 text-xs text-white bg-[#031d27] border border-[#0d3f4f] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono text-[#7fa3b0] mb-1">Max Length</label>
                          <input
                            type="number"
                            value={selectedField.validation?.maxLength ?? ''}
                            onChange={(e) =>
                              handleUpdateSelectedField({
                                validation: {
                                  ...selectedField.validation,
                                  maxLength: e.target.value ? Number(e.target.value) : undefined,
                                },
                              })
                            }
                            placeholder="e.g. 80"
                            className="w-full px-2.5 py-1 text-xs text-white bg-[#031d27] border border-[#0d3f4f] rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Phone Specific Rules */}
                  {selectedField.type === 'phone' && (
                    <div className="space-y-2 p-2.5 rounded-xl bg-[#031d27] border border-[#0d3f4f]/80">
                      <label className="flex items-center justify-between text-xs text-white/90 cursor-pointer">
                        <span>Indian 10-Digit Mobile Only</span>
                        <input
                          type="checkbox"
                          checked={selectedField.validation?.digitsOnly !== false}
                          onChange={(e) =>
                            handleUpdateSelectedField({
                              validation: {
                                ...selectedField.validation,
                                digitsOnly: e.target.checked,
                                minLength: 10,
                                maxLength: 10,
                                countryCode: 'IN',
                              },
                            })
                          }
                          className="size-3.5 text-[#00d2ee] rounded"
                        />
                      </label>
                      <p className="text-[10px] text-[#7fa3b0]">
                        Requires exactly 10 numeric digits (e.g. 9876543210). Rejects letters, spaces, and hyphens. Stored as string identifier.
                      </p>
                    </div>
                  )}

                  {/* 3. Number / Integer Rules */}
                  {selectedField.type === 'number' && (
                    <div className="space-y-2.5">
                      <div className="space-y-1.5 p-2 rounded-xl bg-[#031d27] border border-[#0d3f4f]">
                        <label className="flex items-center justify-between text-xs text-white/90 cursor-pointer">
                          <span>Whole Number Only (Integer)</span>
                          <input
                            type="checkbox"
                            checked={!!selectedField.validation?.integerOnly}
                            onChange={(e) =>
                              handleUpdateSelectedField({
                                validation: {
                                  ...selectedField.validation,
                                  integerOnly: e.target.checked,
                                },
                              })
                            }
                            className="size-3.5 text-[#00d2ee] rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between text-xs text-white/90 cursor-pointer">
                          <span>Positive Numbers Only (&gt; 0)</span>
                          <input
                            type="checkbox"
                            checked={!!selectedField.validation?.positiveOnly}
                            onChange={(e) =>
                              handleUpdateSelectedField({
                                validation: {
                                  ...selectedField.validation,
                                  positiveOnly: e.target.checked,
                                },
                              })
                            }
                            className="size-3.5 text-[#00d2ee] rounded"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-mono text-[#7fa3b0] mb-1">Min Value</label>
                          <input
                            type="number"
                            value={selectedField.validation?.min ?? ''}
                            onChange={(e) =>
                              handleUpdateSelectedField({
                                validation: {
                                  ...selectedField.validation,
                                  min: e.target.value ? Number(e.target.value) : undefined,
                                },
                              })
                            }
                            placeholder="Min"
                            className="w-full px-2.5 py-1 text-xs text-white bg-[#031d27] border border-[#0d3f4f] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono text-[#7fa3b0] mb-1">Max Value</label>
                          <input
                            type="number"
                            value={selectedField.validation?.max ?? ''}
                            onChange={(e) =>
                              handleUpdateSelectedField({
                                validation: {
                                  ...selectedField.validation,
                                  max: e.target.value ? Number(e.target.value) : undefined,
                                },
                              })
                            }
                            placeholder="Max"
                            className="w-full px-2.5 py-1 text-xs text-white bg-[#031d27] border border-[#0d3f4f] rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Image Upload Settings */}
                  {selectedField.type === 'image' && (
                    <div className="space-y-2.5 p-2.5 rounded-xl bg-[#031d27] border border-[#0d3f4f]">
                      <div>
                        <label className="block text-[11px] font-mono text-[#7fa3b0] mb-1">
                          Max File Size (MB)
                        </label>
                        <input
                          type="number"
                          value={selectedField.validation?.imageSettings?.maxFileSizeMB ?? 5}
                          onChange={(e) =>
                            handleUpdateSelectedField({
                              validation: {
                                ...selectedField.validation,
                                imageSettings: {
                                  ...selectedField.validation?.imageSettings,
                                  maxFileSizeMB: Number(e.target.value) || 5,
                                },
                              },
                            })
                          }
                          className="w-full px-2.5 py-1 text-xs text-white bg-[#02131b] border border-[#0d3f4f] rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <label className="flex items-center justify-between text-xs text-white/90 cursor-pointer">
                          <span>Preview Thumbnail Enabled</span>
                          <input
                            type="checkbox"
                            checked={selectedField.validation?.imageSettings?.previewEnabled !== false}
                            onChange={(e) =>
                              handleUpdateSelectedField({
                                validation: {
                                  ...selectedField.validation,
                                  imageSettings: {
                                    ...selectedField.validation?.imageSettings,
                                    previewEnabled: e.target.checked,
                                  },
                                },
                              })
                            }
                            className="size-3.5 text-[#00d2ee] rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between text-xs text-white/90 cursor-pointer">
                          <span>Zoom Inspection Dialog</span>
                          <input
                            type="checkbox"
                            checked={selectedField.validation?.imageSettings?.zoomEnabled !== false}
                            onChange={(e) =>
                              handleUpdateSelectedField({
                                validation: {
                                  ...selectedField.validation,
                                  imageSettings: {
                                    ...selectedField.validation?.imageSettings,
                                    zoomEnabled: e.target.checked,
                                  },
                                },
                              })
                            }
                            className="size-3.5 text-[#00d2ee] rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between text-xs text-white/90 cursor-pointer">
                          <span>Circle Avatar Format (Default)</span>
                          <input
                            type="checkbox"
                            checked={selectedField.validation?.imageSettings?.aspectRatio === '1:1'}
                            onChange={(e) =>
                              handleUpdateSelectedField({
                                validation: {
                                  ...selectedField.validation,
                                  imageSettings: {
                                    ...selectedField.validation?.imageSettings,
                                    aspectRatio: e.target.checked ? '1:1' : 'free',
                                  },
                                },
                              })
                            }
                            className="size-3.5 text-[#00d2ee] rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between text-xs text-white/90 cursor-pointer">
                          <span>Interactive Crop & Edit Tool</span>
                          <input
                            type="checkbox"
                            checked={selectedField.validation?.imageSettings?.cropEnabled !== false}
                            onChange={(e) =>
                              handleUpdateSelectedField({
                                validation: {
                                  ...selectedField.validation,
                                  imageSettings: {
                                    ...selectedField.validation?.imageSettings,
                                    cropEnabled: e.target.checked,
                                  },
                                },
                              })
                            }
                            className="size-3.5 text-[#00d2ee] rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between text-xs text-white/90 cursor-pointer">
                          <span>Image Replacement Allowed</span>
                          <input
                            type="checkbox"
                            defaultChecked={true}
                            className="size-3.5 text-[#00d2ee] rounded"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* 5. Custom Error Messages */}
                  <div className="space-y-2 pt-2 border-t border-[#0d3f4f]/60">
                    <span className="text-[11px] font-mono text-[#7fa3b0] block">
                      Custom Error Feedback Messages
                    </span>
                    <input
                      type="text"
                      value={selectedField.validation?.messages?.required || ''}
                      onChange={(e) =>
                        handleUpdateSelectedField({
                          validation: {
                            ...selectedField.validation,
                            messages: {
                              ...selectedField.validation?.messages,
                              required: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="Custom Required Error Msg"
                      className="w-full px-2.5 py-1 text-xs text-white bg-[#031d27] border border-[#0d3f4f] rounded-lg"
                    />
                    <input
                      type="text"
                      value={selectedField.validation?.messages?.invalid || ''}
                      onChange={(e) =>
                        handleUpdateSelectedField({
                          validation: {
                            ...selectedField.validation,
                            messages: {
                              ...selectedField.validation?.messages,
                              invalid: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="Custom Invalid Format Error Msg"
                      className="w-full px-2.5 py-1 text-xs text-white bg-[#031d27] border border-[#0d3f4f] rounded-lg"
                    />
                  </div>
                </div>

                {/* Conditional rule editor */}
                <div className="pt-3 border-t border-[#0d3f4f] space-y-2">
                  <span className="text-xs font-mono font-medium text-white/70 block">Conditional Visibility</span>
                  <div className="space-y-2 text-xs">
                    <select
                      value={selectedField.conditionalRule?.dependOnFieldKey || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          handleUpdateSelectedField({ conditionalRule: undefined });
                        } else {
                          handleUpdateSelectedField({
                            conditionalRule: {
                              dependOnFieldKey: val,
                              operator: 'notEquals',
                              value: '',
                              action: 'show',
                            },
                          });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-normal text-white bg-[#031d27] border border-[#0d3f4f] rounded-lg"
                    >
                      <option value="">No Dependency (Always Shown)</option>
                      {fields
                        .filter((f) => f.key !== selectedField.key)
                        .map((f) => (
                          <option key={f.key} value={f.key}>
                            Depends on {f.label} ({f.key})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-mono text-[#7fa3b0]">
                Select a field from the canvas to edit its properties.
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ================= PREVIEW MODE MODAL ================= */}
      {/* ================= PREVIEW MODE MODAL ================= */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-[500px] bg-[#02131b] border border-[#0d3f4f] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#0d3f4f] shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-mono font-medium text-white uppercase tracking-wider">
                  Form Preview Mode
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#00d2ee]/15 text-[#00d2ee] border border-[#00d2ee]/30 font-normal">
                  {fields.length} Fields
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#031d27] text-[#00d2ee] border border-[#00d2ee]/30 font-normal">
                  2-Column Grid
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 text-[#7fa3b0] hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                title="Close Preview"
              >
                <IoCloseOutline size={22} />
              </button>
            </div>

            {/* Modal Body: Realistic 2-Column Form Preview with Custom Scrollbar */}
            <div className="flex-1 min-h-0 overflow-y-auto mt-3.5 pr-1 custom-scrollbar">
              <div className="p-4 rounded-2xl bg-[#010e14]/90 border border-[#0d3f4f] space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#0d3f4f] flex-wrap gap-2">
                  <div className="min-w-0 max-w-[280px]">
                    <AutoScrollText
                      text={auctionName || 'Auction Tournament'}
                      className="text-sm font-mono font-medium text-white uppercase tracking-wide"
                    />
                    <p className="text-[11px] font-normal text-[#7fa3b0] mt-0.5">
                      Official {formType === 'TEAM_REGISTRATION' ? 'Franchise Team' : 'Player'} Registration Portal
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-[#00d2ee]/10 text-[#00d2ee] border border-[#00d2ee]/30 font-normal shrink-0">
                    2-Column Grid
                  </span>
                </div>
                <DynamicFormRenderer
                  fields={fields}
                  values={previewValues}
                  onChange={(key, val) => setPreviewValues((prev) => ({ ...prev, [key]: val }))}
                />
                <Separator className="bg-[#0d3f4f] my-3" />
                <div>
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ee] to-[#0466c8] text-[#02131b] font-mono font-medium text-xs uppercase opacity-80 cursor-not-allowed"
                  >
                    Submit Registration (Preview Only)
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3.5 border-t border-[#0d3f4f] mt-3.5 shrink-0">
              <span className="text-[11px] font-mono font-normal text-[#7fa3b0]">
                Live applicant registration view
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 text-xs font-mono font-medium text-[#02131b] bg-[#00d2ee] hover:bg-[#00b8d4] rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PUBLISH CONFIRMATION DIALOG ================= */}
      <PublishConfirmationDialog
        isOpen={isPublishConfirmOpen}
        onClose={() => setIsPublishConfirmOpen(false)}
        onConfirm={handlePublish}
        loading={publishing}
        auctionName={auctionName}
        formType={formType}
        fields={fields}
        currentVersion={template?.version || 1}
      />
    </div>
  );
}

function FormBuilderWrapper({ params }: PageProps) {
  const resolvedParams = use(params);
  return <FormBuilderContent id={resolvedParams.id} />;
}

export default function FormBuilderPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#02131b] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-[#00d2ee] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <FormBuilderWrapper params={params} />
    </Suspense>
  );
}
