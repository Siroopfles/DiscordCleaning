import { ValidatedParameter, ValidationType, ParameterValidation, CommandError } from '../types/discord.types';
import { createParameterError } from './commandErrors';

// Standaard validatie functies per type
const typeValidators: Record<ValidationType, (value: unknown) => boolean> = {
  STRING: (value): value is string => typeof value === 'string',
  NUMBER: (value): value is number => typeof value === 'number' && !isNaN(value),
  BOOLEAN: (value): value is boolean => typeof value === 'boolean',
  USER: (value): boolean => typeof value === 'string' && /^\d{17,19}$/.test(value),
  CHANNEL: (value): boolean => typeof value === 'string' && /^\d{17,19}$/.test(value),
  ROLE: (value): boolean => typeof value === 'string' && /^\d{17,19}$/.test(value),
};

// Standaard sanitization functies per type
const typeSanitizers: Record<ValidationType, (value: unknown) => unknown> = {
  STRING: (value: unknown) => String(value).trim(),
  NUMBER: (value: unknown) => Number(value),
  BOOLEAN: (value: unknown) => Boolean(value),
  USER: (value: unknown) => String(value),
  CHANNEL: (value: unknown) => String(value),
  ROLE: (value: unknown) => String(value),
};

// Helper functie voor range validatie
function validateRange(value: number, min?: number, max?: number): boolean {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

// Helper functie voor pattern validatie
function validatePattern(value: string, pattern?: RegExp): boolean {
  if (!pattern) return true;
  return pattern.test(value);
}

// Hoofdvalidatie functie voor een enkele parameter
export async function validateParameter(
  parameter: ValidatedParameter,
  value: unknown
): Promise<{ isValid: boolean; error?: CommandError; sanitizedValue?: unknown }> {
  const { name, validation } = parameter;

  // Check required
  if (validation.required && (value === undefined || value === null)) {
    return {
      isValid: false,
      error: createParameterError(`Parameter ${name} is verplicht`, name),
    };
  }

  // Skip verdere validatie als waarde optioneel en niet aanwezig is
  if (!validation.required && (value === undefined || value === null)) {
    return { isValid: true };
  }

  // Type validatie
  const typeValidator = typeValidators[validation.type];
  if (!typeValidator(value)) {
    return {
      isValid: false,
      error: createParameterError(
        `Parameter ${name} moet van type ${validation.type} zijn`,
        name
      ),
    };
  }

  // Extra validaties op basis van type
  if (validation.type === 'NUMBER' && typeof value === 'number') {
    if (!validateRange(value, validation.min, validation.max)) {
      return {
        isValid: false,
        error: createParameterError(
          `Parameter ${name} moet tussen ${validation.min} en ${validation.max} liggen`,
          name
        ),
      };
    }
  }

  if (validation.type === 'STRING' && typeof value === 'string') {
    if (!validatePattern(value, validation.pattern)) {
      return {
        isValid: false,
        error: createParameterError(
          `Parameter ${name} voldoet niet aan het vereiste patroon`,
          name
        ),
      };
    }
  }

  // Custom validatie indien aanwezig
  if (validation.custom) {
    const isCustomValid = await validation.custom(value);
    if (!isCustomValid) {
      return {
        isValid: false,
        error: createParameterError(
          `Parameter ${name} voldoet niet aan de aangepaste validatie`,
          name
        ),
      };
    }
  }

  // Sanitization
  const sanitizer = parameter.sanitize || typeSanitizers[validation.type];
  const sanitizedValue = sanitizer(value);

  return {
    isValid: true,
    sanitizedValue,
  };
}

// Valideer meerdere parameters tegelijk
export async function validateParameters(
  parameters: ValidatedParameter[],
  values: Record<string, unknown>
): Promise<{
  isValid: boolean;
  errors?: CommandError[];
  sanitizedValues?: Record<string, unknown>;
}> {
  const errors: CommandError[] = [];
  const sanitizedValues: Record<string, unknown> = {};

  for (const parameter of parameters) {
    const value = values[parameter.name];
    const result = await validateParameter(parameter, value);

    if (!result.isValid && result.error) {
      errors.push(result.error);
    } else if (result.sanitizedValue !== undefined) {
      sanitizedValues[parameter.name] = result.sanitizedValue;
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    sanitizedValues: errors.length === 0 ? sanitizedValues : undefined,
  };
}