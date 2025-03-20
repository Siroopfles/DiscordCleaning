"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParameter = validateParameter;
exports.validateParameters = validateParameters;
const commandErrors_1 = require("./commandErrors");
// Standaard validatie functies per type
const typeValidators = {
    STRING: (value) => typeof value === 'string',
    NUMBER: (value) => typeof value === 'number' && !isNaN(value),
    BOOLEAN: (value) => typeof value === 'boolean',
    USER: (value) => typeof value === 'string' && /^\d{17,19}$/.test(value),
    CHANNEL: (value) => typeof value === 'string' && /^\d{17,19}$/.test(value),
    ROLE: (value) => typeof value === 'string' && /^\d{17,19}$/.test(value),
};
// Standaard sanitization functies per type
const typeSanitizers = {
    STRING: (value) => String(value).trim(),
    NUMBER: (value) => Number(value),
    BOOLEAN: (value) => Boolean(value),
    USER: (value) => String(value),
    CHANNEL: (value) => String(value),
    ROLE: (value) => String(value),
};
// Helper functie voor range validatie
function validateRange(value, min, max) {
    if (min !== undefined && value < min)
        return false;
    if (max !== undefined && value > max)
        return false;
    return true;
}
// Helper functie voor pattern validatie
function validatePattern(value, pattern) {
    if (!pattern)
        return true;
    return pattern.test(value);
}
// Hoofdvalidatie functie voor een enkele parameter
async function validateParameter(parameter, value) {
    const { name, validation } = parameter;
    // Check required
    if (validation.required && (value === undefined || value === null)) {
        return {
            isValid: false,
            error: (0, commandErrors_1.createParameterError)(`Parameter ${name} is verplicht`, name),
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
            error: (0, commandErrors_1.createParameterError)(`Parameter ${name} moet van type ${validation.type} zijn`, name),
        };
    }
    // Extra validaties op basis van type
    if (validation.type === 'NUMBER' && typeof value === 'number') {
        if (!validateRange(value, validation.min, validation.max)) {
            return {
                isValid: false,
                error: (0, commandErrors_1.createParameterError)(`Parameter ${name} moet tussen ${validation.min} en ${validation.max} liggen`, name),
            };
        }
    }
    if (validation.type === 'STRING' && typeof value === 'string') {
        if (!validatePattern(value, validation.pattern)) {
            return {
                isValid: false,
                error: (0, commandErrors_1.createParameterError)(`Parameter ${name} voldoet niet aan het vereiste patroon`, name),
            };
        }
    }
    // Custom validatie indien aanwezig
    if (validation.custom) {
        const isCustomValid = await validation.custom(value);
        if (!isCustomValid) {
            return {
                isValid: false,
                error: (0, commandErrors_1.createParameterError)(`Parameter ${name} voldoet niet aan de aangepaste validatie`, name),
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
async function validateParameters(parameters, values) {
    const errors = [];
    const sanitizedValues = {};
    for (const parameter of parameters) {
        const value = values[parameter.name];
        const result = await validateParameter(parameter, value);
        if (!result.isValid && result.error) {
            errors.push(result.error);
        }
        else if (result.sanitizedValue !== undefined) {
            sanitizedValues[parameter.name] = result.sanitizedValue;
        }
    }
    return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        sanitizedValues: errors.length === 0 ? sanitizedValues : undefined,
    };
}
//# sourceMappingURL=validators.js.map