import type { IFormField } from '../../models/FormTemplate.model.ts';

const RESERVED_FIELD_KEYS = new Set([
  '_id',
  'id',
  'auctionid',
  'teamid',
  'createdat',
  'updatedat',
  '__v',
  'status',
]);

// Permitted international personal name characters (letters, accented letters, spaces, hyphens, apostrophes, dots)
const PERSON_NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'\-.]+$/;

// Standard 10-digit mobile number format
const PHONE_10_DIGIT_REGEX = /^[0-9]{10}$/;

// RFC 5322 compliant simplified email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class FormValidationService {
  /**
   * Validates a single field's configuration before publishing.
   */
  static validateFieldDefinition(field: IFormField): { valid: boolean; error?: string } {
    if (!field.key || typeof field.key !== 'string') {
      return { valid: false, error: 'Field key is required and must be a string.' };
    }

    const trimmedKey = field.key.trim();
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedKey)) {
      return {
        valid: false,
        error: `Field key '${field.key}' must start with a letter or underscore and contain only alphanumeric characters and underscores.`,
      };
    }

    if (RESERVED_FIELD_KEYS.has(trimmedKey.toLowerCase())) {
      return { valid: false, error: `Field key '${field.key}' is a reserved system identifier.` };
    }

    if (!field.label || typeof field.label !== 'string' || field.label.trim() === '') {
      return { valid: false, error: `Field '${field.key}' must have a valid label.` };
    }

    // Incompatible rule checks
    if (field.type !== 'number' && (field.validation?.min !== undefined || field.validation?.max !== undefined)) {
      return {
        valid: false,
        error: `Numeric range rules (min/max) cannot be applied to non-numeric field '${field.key}'.`,
      };
    }

    if (field.type !== 'number' && (field.validation?.integerOnly || field.validation?.positiveOnly)) {
      return {
        valid: false,
        error: `Integer/positive rules cannot be applied to non-numeric field '${field.key}'.`,
      };
    }

    return { valid: true };
  }

  /**
   * Validates an entire template schema definition before draft saving or publishing.
   */
  static validateTemplateDefinition(fields: IFormField[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const seenKeys = new Set<string>();

    if (!Array.isArray(fields) || fields.length === 0) {
      return { valid: false, errors: ['A form template must contain at least one field.'] };
    }

    for (const field of fields) {
      const lowerKey = (field.key || '').trim().toLowerCase();
      if (seenKeys.has(lowerKey)) {
        errors.push(`Duplicate field key '${field.key}' detected. Field keys must be unique.`);
      } else {
        seenKeys.add(lowerKey);
      }

      const res = this.validateFieldDefinition(field);
      if (!res.valid && res.error) {
        errors.push(res.error);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validates submitted key-value data against effective form fields.
   */
  static validateSubmission(
    fields: IFormField[],
    data: Record<string, any>
  ): { valid: boolean; errors: Array<{ field: string; message: string }> } {
    const errors: Array<{ field: string; message: string }> = [];

    for (const field of fields) {
      // If field is hidden, skip validation
      if (!field.visible) continue;

      // Evaluate conditional rule if defined
      if (field.conditionalRule && field.conditionalRule.dependOnFieldKey) {
        const parentVal = data[field.conditionalRule.dependOnFieldKey];
        const { operator, value, action } = field.conditionalRule;

        let conditionMet = false;
        if (operator === 'equals') conditionMet = parentVal === value;
        else if (operator === 'notEquals')
          conditionMet = parentVal !== value && parentVal !== undefined && parentVal !== '';
        else if (operator === 'contains')
          conditionMet = String(parentVal || '').includes(String(value));
        else if (operator === 'in')
          conditionMet = Array.isArray(value) && value.includes(parentVal);

        if (action === 'show' && !conditionMet) {
          continue; // Field is conditionally hidden
        }
      }

      const rawVal = data[field.key];
      const isPresent =
        rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '';
      const strVal = isPresent ? String(rawVal).trim() : '';

      // 1. Check required
      if (field.required && !isPresent) {
        const reqMsg =
          field.validation?.messages?.required || `${field.label} is required.`;
        errors.push({ field: field.key, message: reqMsg });
        continue;
      }

      // 2. If value is present, execute field type and validation rules
      if (isPresent) {
        // Person Name / String character validation
        if (
          field.validation?.allowedCharacters === 'PERSON_NAME' ||
          (field.key.toLowerCase().includes('name') && field.type === 'text')
        ) {
          if (!PERSON_NAME_REGEX.test(strVal)) {
            const invalidMsg =
              field.validation?.messages?.invalid ||
              `Enter a valid ${field.label.toLowerCase()} using letters only. Numbers and special characters are not allowed.`;
            errors.push({ field: field.key, message: invalidMsg });
          }
        }

        // Phone Validation (Digit-only & 10-digit mobile rule)
        if (field.type === 'phone' || field.validation?.digitsOnly) {
          // If strictly digits only or Indian mobile
          if (field.validation?.digitsOnly || field.validation?.countryCode === 'IN' || field.type === 'phone') {
            if (!PHONE_10_DIGIT_REGEX.test(strVal)) {
              const invalidMsg =
                field.validation?.messages?.invalid ||
                `Enter a valid 10-digit mobile number for ${field.label}. Letters, spaces, and special characters are not permitted.`;
              errors.push({ field: field.key, message: invalidMsg });
            }
          }
        }

        // Numeric Field Validation
        if (field.type === 'number') {
          const num = Number(rawVal);
          if (isNaN(num)) {
            errors.push({ field: field.key, message: `${field.label} must be a valid number.` });
          } else {
            if (field.validation?.integerOnly && !Number.isInteger(num)) {
              errors.push({ field: field.key, message: `${field.label} must be a whole number (integer).` });
            }
            if (field.validation?.positiveOnly && num <= 0) {
              errors.push({ field: field.key, message: `${field.label} must be a positive number.` });
            }
            if (field.validation?.min !== undefined && num < field.validation.min) {
              errors.push({
                field: field.key,
                message: `${field.label} must be at least ${field.validation.min}.`,
              });
            }
            if (field.validation?.max !== undefined && num > field.validation.max) {
              errors.push({
                field: field.key,
                message: `${field.label} cannot exceed ${field.validation.max}.`,
              });
            }
          }
        }

        // Email Validation
        if (field.type === 'email') {
          if (!EMAIL_REGEX.test(strVal)) {
            const invalidMsg =
              field.validation?.messages?.invalid ||
              `Please enter a valid email address for ${field.label}.`;
            errors.push({ field: field.key, message: invalidMsg });
          }
        }

        // Min & Max Length
        if (field.validation?.minLength !== undefined && strVal.length < field.validation.minLength) {
          errors.push({
            field: field.key,
            message: `${field.label} must be at least ${field.validation.minLength} characters.`,
          });
        }
        if (field.validation?.maxLength !== undefined && strVal.length > field.validation.maxLength) {
          errors.push({
            field: field.key,
            message: `${field.label} cannot exceed ${field.validation.maxLength} characters.`,
          });
        }

        // Custom regex pattern
        if (field.validation?.pattern) {
          try {
            const customRegex = new RegExp(field.validation.pattern);
            if (!customRegex.test(strVal)) {
              const invalidMsg =
                field.validation?.messages?.invalid || `${field.label} does not match the required format.`;
              errors.push({ field: field.key, message: invalidMsg });
            }
          } catch {
            // ignore invalid server regex string
          }
        }

        // Date Validation
        if (field.type === 'date') {
          const parsedDate = new Date(strVal);
          if (isNaN(parsedDate.getTime())) {
            errors.push({ field: field.key, message: `Please enter a valid date for ${field.label}.` });
          } else {
            if (field.validation?.minDate) {
              const minD = new Date(field.validation.minDate);
              if (parsedDate < minD) {
                errors.push({
                  field: field.key,
                  message: `${field.label} cannot be earlier than ${field.validation.minDate}.`,
                });
              }
            }
            if (field.validation?.maxDate) {
              const maxD = new Date(field.validation.maxDate);
              if (parsedDate > maxD) {
                errors.push({
                  field: field.key,
                  message: `${field.label} cannot be later than ${field.validation.maxDate}.`,
                });
              }
            }
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
