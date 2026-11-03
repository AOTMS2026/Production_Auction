'use client';

import React, { useState } from 'react';
import { FormField } from '@/types/auction';
import { ImageUploadField } from './ImageUploadField';
import { AutoScrollText } from '@/components/ui/AutoScrollText';
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldContent,
} from '@/components/ui/Form';

interface DynamicFormRendererProps {
  fields: FormField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
  onValidationChange?: (hasErrors: boolean) => void;
}

const PERSON_NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'\-.]+$/;
const PHONE_10_DIGIT_REGEX = /^[0-9]{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  fields,
  values,
  onChange,
  disabled = false,
  errors: parentErrors = {},
}) => {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Field inline validation logic
  const validateField = (field: FormField, val: any) => {
    const isPresent = val !== undefined && val !== null && String(val).trim() !== '';
    const strVal = isPresent ? String(val).trim() : '';

    if (field.required && !isPresent) {
      return field.validation?.messages?.required || `${field.label} is required.`;
    }

    if (isPresent) {
      // 1. Person Name validation
      if (
        field.validation?.allowedCharacters === 'PERSON_NAME' ||
        (field.key.toLowerCase().includes('name') && field.type === 'text')
      ) {
        if (!PERSON_NAME_REGEX.test(strVal)) {
          return (
            field.validation?.messages?.invalid ||
            `Enter a valid ${field.label.toLowerCase()} using letters only.`
          );
        }
      }

      // 2. Phone 10-digit validation
      if (field.type === 'phone' || field.validation?.digitsOnly) {
        if (!PHONE_10_DIGIT_REGEX.test(strVal)) {
          return (
            field.validation?.messages?.invalid ||
            `Enter a valid 10-digit mobile number for ${field.label}.`
          );
        }
      }

      // 3. Email validation
      if (field.type === 'email') {
        if (!EMAIL_REGEX.test(strVal)) {
          return (
            field.validation?.messages?.invalid ||
            `Please enter a valid email address.`
          );
        }
      }

      // 4. Numeric validation
      if (field.type === 'number') {
        const num = Number(val);
        if (isNaN(num)) {
          return `${field.label} must be a valid number.`;
        }
        if (field.validation?.integerOnly && !Number.isInteger(num)) {
          return `${field.label} must be a whole number (integer).`;
        }
        if (field.validation?.positiveOnly && num <= 0) {
          return `${field.label} must be a positive number.`;
        }
        if (field.validation?.min !== undefined && num < field.validation.min) {
          return `${field.label} must be at least ${field.validation.min}.`;
        }
        if (field.validation?.max !== undefined && num > field.validation.max) {
          return `${field.label} cannot exceed ${field.validation.max}.`;
        }
      }

      // 5. Length checks
      if (field.validation?.minLength && strVal.length < field.validation.minLength) {
        return `${field.label} must be at least ${field.validation.minLength} characters.`;
      }
      if (field.validation?.maxLength && strVal.length > field.validation.maxLength) {
        return `${field.label} cannot exceed ${field.validation.maxLength} characters.`;
      }
    }

    return null;
  };

  const handleFieldChange = (field: FormField, newVal: any) => {
    onChange(field.key, newVal);
    const err = validateField(field, newVal);
    setLocalErrors((prev) => {
      const next = { ...prev };
      if (err) next[field.key] = err;
      else delete next[field.key];
      return next;
    });
  };

  // Check conditional visibility
  const isFieldVisible = (field: FormField) => {
    if (!field.visible) return false;
    if (!field.conditionalRule || !field.conditionalRule.dependOnFieldKey) return true;

    const parentVal = values[field.conditionalRule.dependOnFieldKey];
    const { operator, value, action } = field.conditionalRule;

    let conditionMet = false;
    if (operator === 'equals') conditionMet = parentVal === value;
    else if (operator === 'notEquals')
      conditionMet = parentVal !== value && parentVal !== undefined && parentVal !== '';
    else if (operator === 'contains')
      conditionMet = String(parentVal || '').includes(String(value));
    else if (operator === 'in')
      conditionMet = Array.isArray(value) && value.includes(parentVal);

    if (action === 'show') return conditionMet;
    if (action === 'hide') return !conditionMet;
    return true;
  };

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  // Separate image fields to render as Hero Center Image at the top
  const imageFields = sortedFields.filter((f) => f.type === 'image');
  const nonImageFields = sortedFields.filter((f) => f.type !== 'image');

  const getColSpanClass = (field: FormField) => {
    // Consent/Agree, File attachments, Sections, and Descriptions must ALWAYS span full width (2 columns)
    if (
      field.type === 'consent' ||
      field.type === 'checkbox' ||
      field.type === 'file' ||
      field.type === 'section' ||
      field.type === 'textarea' ||
      field.type === 'description' ||
      field.key === 'consentDeclaration' ||
      field.key === 'termsConsent' ||
      field.key === 'idProofUpload' ||
      field.key === 'paymentUpload'
    ) {
      return 'col-span-1 sm:col-span-2';
    }
    if (field.colSpan === 2) return 'col-span-1 sm:col-span-2';
    return 'col-span-1';
  };

  return (
    <div className="w-full flex flex-col">
      {/* 1. Hero Center Image Upload Section */}
      {imageFields.length > 0 && (
        <div className="w-full flex flex-col items-center justify-center pt-2 sm:pt-3 pb-3 mb-2.5 border-b border-[#0d3f4f]/50 shrink-0">
          {imageFields.map((field) => {
            if (!isFieldVisible(field)) return null;
            const val = values[field.key] ?? field.defaultValue ?? '';
            const fieldError = localErrors[field.key] || parentErrors[field.key];

            return (
              <div key={field.key} className="w-full max-w-[340px] flex flex-col items-center">
                <ImageUploadField
                  value={val}
                  onChange={(imgUrl) => handleFieldChange(field, imgUrl)}
                  disabled={disabled || !field.editable}
                  fieldLabel={field.label}
                  maxFileSizeMB={
                    field.validation?.imageSettings?.maxFileSizeMB ||
                    field.validation?.maxFileSizeMb ||
                    5
                  }
                  allowedFormats={
                    field.validation?.imageSettings?.allowedFormats || [
                      'image/jpeg',
                      'image/png',
                      'image/webp',
                    ]
                  }
                  previewEnabled={field.validation?.imageSettings?.previewEnabled ?? true}
                  zoomEnabled={field.validation?.imageSettings?.zoomEnabled ?? true}
                  cropEnabled={field.validation?.imageSettings?.cropEnabled ?? true}
                  defaultShape="circle"
                />
                {fieldError && (
                  <div className="mt-1 text-[11px] text-rose-400 font-mono text-center">
                    {fieldError}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Compact Form Details Grid */}
      <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {nonImageFields.map((field) => {
          if (!isFieldVisible(field)) return null;

          const val = values[field.key] ?? field.defaultValue ?? '';
          const colClass = getColSpanClass(field);
          const fieldError = localErrors[field.key] || parentErrors[field.key];

          if (field.type === 'section') {
            return (
              <div key={field.key} className={`pt-2.5 pb-1 ${colClass}`}>
                <FieldSeparator className="border-[#0d3f4f]/60" />
                <div className="pt-2">
                  <span className="text-xs font-mono font-medium text-white tracking-wider uppercase block mb-0.5">
                    {field.label}
                  </span>
                  {field.description && (
                    <FieldDescription className="text-[10px] text-[#7fa3b0]">
                      {field.description}
                    </FieldDescription>
                  )}
                </div>
              </div>
            );
          }

          if (field.type === 'description') {
            return (
              <div
                key={field.key}
                className={`p-3 rounded-2xl bg-[#031822] border border-[#0d3f4f] text-xs font-normal text-[#7fa3b0] ${colClass}`}
              >
                <span className="font-mono font-medium text-white block mb-0.5">
                  {field.label}
                </span>
                <FieldDescription className="text-[11px]">
                  {field.description || field.placeholder}
                </FieldDescription>
              </div>
            );
          }

          {/* Agree / Consent / Terms Declaration — Full Width with Clean Padding & Position */}
          if (field.type === 'consent' || field.type === 'checkbox') {
            return (
              <div
                key={field.key}
                className="col-span-1 sm:col-span-2 w-full p-3.5 sm:p-4 rounded-2xl bg-[#031822] border border-[#0d3f4f] hover:border-[#00d2ee]/40 transition-all flex items-start gap-3 mt-1 shadow-sm"
              >
                <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    id={`field-${field.key}`}
                    checked={!!val}
                    onChange={(e) => handleFieldChange(field, e.target.checked)}
                    disabled={disabled || !field.editable}
                    className="size-4.5 rounded-md border border-[#0d3f4f] bg-[#011428] text-[#00d2ee] accent-[#00d2ee] focus:ring-1 focus:ring-[#00d2ee] cursor-pointer transition-all"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`field-${field.key}`}
                    className="cursor-pointer select-none text-xs font-mono text-white/95 leading-relaxed block hover:text-white"
                  >
                    {field.label}{' '}
                    {field.required && (
                      <span className="text-rose-400 font-bold ml-0.5">*</span>
                    )}
                  </label>
                  {field.description && (
                    <p className="text-[11px] text-[#7fa3b0] mt-1 font-normal leading-normal">
                      {field.description}
                    </p>
                  )}
                  {fieldError && (
                    <span className="text-[10px] text-rose-400 font-mono mt-1 block">
                      {fieldError}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          return (
            <Field key={field.key} className={`${colClass} flex flex-col gap-1 min-w-0`}>
              {/* Field Label Row with Stable Clean Typography */}
              <div className="flex items-center justify-between gap-1.5 overflow-hidden">
                <div className="flex-1 min-w-0 flex items-center gap-1">
                  <span
                    className="text-[11px] font-mono uppercase tracking-wider text-[#7fa3b0] font-medium truncate block"
                    title={field.label}
                  >
                    {field.label}
                  </span>
                  {field.required && (
                    <span className="text-rose-400 font-bold shrink-0">*</span>
                  )}
                </div>
                {field.validation?.allowedCharacters === 'PERSON_NAME' && (
                  <span className="text-[10px] text-[#00d2ee] font-mono shrink-0">
                    Letters
                  </span>
                )}
                {(field.type === 'phone' || field.validation?.digitsOnly) && (
                  <span className="text-[10px] text-[#00d2ee] font-mono shrink-0">
                    10 Digits
                  </span>
                )}
              </div>

              {field.description && (
                <FieldDescription
                  className="text-[10px] text-[#5c8290] leading-tight line-clamp-1"
                  title={field.description}
                >
                  {field.description}
                </FieldDescription>
              )}

              {/* Compact Input Controls (Short Height) */}
              {field.type === 'textarea' ? (
                <textarea
                  id={`field-${field.key}`}
                  value={val}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  disabled={disabled || !field.editable}
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-xs text-white bg-[#031822] border border-[#0d3f4f] rounded-xl focus:outline-none focus:border-[#00d2ee] focus:ring-1 focus:ring-[#00d2ee] transition-all resize-none placeholder:text-white/20"
                />
              ) : field.type === 'select' || field.type === 'paymentMode' ? (
                <select
                  id={`field-${field.key}`}
                  value={val}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  disabled={disabled || !field.editable}
                  className="w-full h-8.5 px-2 py-1 text-xs text-white bg-[#031822] border border-[#0d3f4f] rounded-xl focus:outline-none focus:border-[#00d2ee] focus:ring-1 focus:ring-[#00d2ee] transition-all cursor-pointer"
                >
                  <option value="" className="bg-[#02131b] text-white/50">
                    Select {field.label}...
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#02131b] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'radio' ? (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {field.options?.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-all ${
                        val === opt.value
                          ? 'bg-[#00d2ee]/15 border-[#00d2ee] text-[#00d2ee] font-medium shadow-sm'
                          : 'bg-[#031822] border-[#0d3f4f] text-[#7fa3b0] hover:text-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name={field.key}
                        value={opt.value}
                        checked={val === opt.value}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        disabled={disabled || !field.editable}
                        className="sr-only"
                      />
                      <span
                        className={`size-2 rounded-full border ${
                          val === opt.value
                            ? 'bg-[#00d2ee] border-[#00d2ee]'
                            : 'border-[#0d3f4f]'
                        }`}
                      />
                      <span className="truncate max-w-[130px]" title={opt.label}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              ) : field.type === 'file' ? (
                <div className="flex items-center gap-2">
                  <input
                    id={`field-${field.key}`}
                    type="text"
                    value={val}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    placeholder="Document URL or attachment"
                    disabled={disabled || !field.editable}
                    className="flex-1 h-8.5 px-2.5 py-1 text-xs text-white bg-[#031822] border border-[#0d3f4f] rounded-xl focus:outline-none focus:border-[#00d2ee] placeholder:text-white/20"
                  />
                  <button
                    type="button"
                    disabled={disabled || !field.editable}
                    onClick={() =>
                      handleFieldChange(
                        field,
                        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
                      )
                    }
                    className="px-3 h-8.5 text-[11px] text-[#00d2ee] bg-[#00d2ee]/10 hover:bg-[#00d2ee]/20 rounded-xl border border-[#00d2ee]/30 transition-colors cursor-pointer shrink-0 font-mono"
                  >
                    Demo File
                  </button>
                </div>
              ) : (
                <input
                  id={`field-${field.key}`}
                  type={
                    field.type === 'number'
                      ? 'number'
                      : field.type === 'email'
                      ? 'email'
                      : field.type === 'date'
                      ? 'date'
                      : 'text'
                  }
                  value={val}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (field.type === 'phone' || field.validation?.digitsOnly) {
                      v = v.replace(/\D/g, '').slice(0, 10);
                    }
                    handleFieldChange(field, v);
                  }}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  disabled={disabled || !field.editable}
                  className="w-full h-8.5 px-2.5 py-1 text-xs text-white bg-[#031822] border border-[#0d3f4f] rounded-xl focus:outline-none focus:border-[#00d2ee] focus:ring-1 focus:ring-[#00d2ee] transition-all placeholder:text-white/20"
                />
              )}

              {fieldError && (
                <span className="text-[10px] text-rose-400 font-mono mt-0.5 block">
                  {fieldError}
                </span>
              )}
            </Field>
          );
        })}
      </FieldGroup>
    </div>
  );
};
