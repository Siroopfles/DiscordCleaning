import Ajv, { ValidateFunction, ErrorObject, KeywordDefinition } from 'ajv';
import addFormats from 'ajv-formats';
import { ConfigSchema, ValidationResult } from '../../../interfaces/config';
import { AbstractConfigValidator } from '../abstract-config-validator';

type CustomKeyword = {
  name: string;
  definition: KeywordDefinition;
};

interface TypeInference {
  schema: ConfigSchema;
  typescript: string;
}

/**
 * JSON Schema validator implementation using AJV with enhanced features:
 * - Schema compilation caching
 * - Custom keyword support
 * - Type inference
 * - Format validation
 */
export class JSONSchemaValidator extends AbstractConfigValidator {
  private readonly ajv: InstanceType<typeof Ajv>;
  private readonly compiledSchemas: Map<string, ValidateFunction>;
  private readonly customKeywords: Map<string, KeywordDefinition>;
  private readonly typeCache: Map<string, TypeInference>;

  constructor() {
    super();
    
    // Initialize AJV with enhanced options
    this.ajv = new Ajv({
      allErrors: true, // Report all errors
      coerceTypes: false, // Don't coerce types for safety
      useDefaults: true, // Apply default values
      removeAdditional: false, // Don't remove additional properties
      strict: true, // Strict mode for better error catching
      validateFormats: true, // Enable format validation
      validateSchema: 'log' // Log schema validation errors
    });

    // Add format validators
    addFormats(this.ajv);

    this.compiledSchemas = new Map();
    this.customKeywords = new Map();
    this.typeCache = new Map();

    // Add some common custom keywords
    this.addCustomKeyword({
      name: 'isSecret',
      definition: {
        keyword: 'isSecret',
        type: 'string',
        schemaType: 'boolean',
        validate: function validate(schema: boolean, data: any): boolean {
          return typeof data === 'string';
        },
        errors: false
      }
    });

    this.addCustomKeyword({
      name: 'encrypted',
      definition: {
        keyword: 'encrypted',
        type: 'string',
        schemaType: 'boolean',
        validate: function validate(schema: boolean, data: any): boolean {
          return typeof data === 'string';
        },
        errors: false
      }
    });
  }

  /**
   * Validate a schema definition
   * @param schema Schema to validate
   */
  protected async validateSchema(schema: ConfigSchema): Promise<void> {
    try {
      // Validate schema against JSON Schema meta-schema
      const metaSchema = this.ajv.getSchema('http://json-schema.org/draft-07/schema#');
      if (!metaSchema) {
        throw new Error('JSON Schema meta-schema not found');
      }

      const isValid = metaSchema(schema);
      if (!isValid && metaSchema.errors) {
        const errors = metaSchema.errors.map((err: ErrorObject) =>
          `${err.schemaPath || ''} ${err.message || 'Unknown error'}`
        ).join(', ');
        throw new Error(`Invalid JSON Schema: ${errors}`);
      }

      // Generate and cache TypeScript types
      this.generateTypeInference(schema);
    } catch (error) {
      throw new Error(`Schema validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate a value against a schema
   * @param schema Schema to validate against
   * @param value Value to validate
   */
  protected async validateValue(schema: ConfigSchema, value: unknown): Promise<ValidationResult> {
    let validate: ValidateFunction;

    try {
      if (typeof schema === 'string') {
        const cached = this.compiledSchemas.get(schema);
        if (cached) {
          validate = cached;
        } else {
          const schemaObj = await this.getSchema(schema);
          if (!schemaObj) {
            throw new Error(`Schema '${schema}' not found`);
          }
          validate = this.ajv.compile(schemaObj);
          this.compiledSchemas.set(schema, validate);
        }
      } else {
        validate = this.ajv.compile(schema);
      }
    } catch (error) {
      throw new Error(`Schema compilation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      const result = validate(value);
      const isValid = await (typeof result === 'boolean' ? result : result);

      return {
        isValid: Boolean(isValid),
        errors: validate.errors?.map((err: ErrorObject) => ({
          path: err.schemaPath || '',
          message: err.message || 'Unknown validation error'
        }))
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          path: '',
          message: `Validation error: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Add a custom validation keyword
   */
  public addCustomKeyword(keyword: CustomKeyword): void {
    if (this.customKeywords.has(keyword.name)) {
      throw new Error(`Custom keyword '${keyword.name}' already exists`);
    }

    this.ajv.addKeyword(keyword.definition);
    this.customKeywords.set(keyword.name, keyword.definition);
  }

  /**
   * Remove a custom validation keyword
   */
  public removeCustomKeyword(name: string): void {
    if (!this.customKeywords.has(name)) {
      throw new Error(`Custom keyword '${name}' not found`);
    }

    this.ajv.removeKeyword(name);
    this.customKeywords.delete(name);
  }

  /**
   * Get TypeScript type definition for a schema
   */
  public getTypeDefinition(schemaName: string): string | undefined {
    const typeInfo = this.typeCache.get(schemaName);
    return typeInfo?.typescript;
  }

  /**
   * Generate TypeScript type definition from schema
   */
  private generateTypeInference(schema: ConfigSchema): void {
    // Simple type mapping for demonstration
    const generateType = (schema: ConfigSchema): string => {
      if (schema.type === 'object' && schema.properties) {
        const props = Object.entries(schema.properties)
          .map(([key, prop]) => `${key}: ${generateType(prop as ConfigSchema)};`)
          .join('\n  ');
        return `{\n  ${props}\n}`;
      }

      switch (schema.type) {
        case 'string': return 'string';
        case 'number': return 'number';
        case 'integer': return 'number';
        case 'boolean': return 'boolean';
        case 'array': return schema.items
          ? `Array<${generateType(schema.items as ConfigSchema)}>`
          : 'Array<unknown>';
        case 'null': return 'null';
        default: return 'unknown';
      }
    };

    const typescript = generateType(schema);
    const schemaId = typeof schema === 'object' && '$id' in schema && typeof schema.$id === 'string'
      ? schema.$id
      : 'default';
    this.typeCache.set(schemaId, { schema, typescript });
  }

  /**
   * Clean up validator resources
   */
  public async dispose(): Promise<void> {
    await super.dispose();
    this.compiledSchemas.clear();
    this.customKeywords.clear();
    this.typeCache.clear();
    // Remove all schemas from ajv instance
    this.ajv.removeSchema();
  }
}