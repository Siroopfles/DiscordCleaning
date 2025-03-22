import { ConfigSchema, IConfigValidator, ValidationResult } from '../../interfaces/config';

/**
 * Abstract base class for configuration validators
 */
export abstract class AbstractConfigValidator implements IConfigValidator {
  protected schemas: Map<string, ConfigSchema>;

  constructor() {
    this.schemas = new Map<string, ConfigSchema>();
  }

  /**
   * Add a schema to the validator
   * @param name Schema name/identifier
   * @param schema JSON Schema definition
   */
  public async addSchema(name: string, schema: ConfigSchema): Promise<void> {
    if (this.schemas.has(name)) {
      throw new Error(`Schema '${name}' already exists`);
    }
    await this.validateSchema(schema);
    this.schemas.set(name, schema);
  }

  /**
   * Remove a schema from the validator
   * @param name Schema name/identifier
   */
  public async removeSchema(name: string): Promise<void> {
    if (!this.schemas.has(name)) {
      throw new Error(`Schema '${name}' not found`);
    }
    this.schemas.delete(name);
  }

  /**
   * Get a registered schema
   * @param name Schema name/identifier
   */
  public async getSchema(name: string): Promise<ConfigSchema | undefined> {
    return this.schemas.get(name);
  }

  /**
   * Check if a schema exists
   * @param name Schema name/identifier
   */
  public async hasSchema(name: string): Promise<boolean> {
    return this.schemas.has(name);
  }

  /**
   * Get all registered schema names
   */
  public async getSchemaNames(): Promise<string[]> {
    return Array.from(this.schemas.keys());
  }

  /**
   * Clean up validator resources
   */
  public async dispose(): Promise<void> {
    this.schemas.clear();
  }

  /**
   * Validate a value against a schema
   * @param schemaName Schema name/identifier
   * @param value Value to validate
   */
  public async validate(schemaName: string, value: unknown): Promise<ValidationResult> {
    const schema = await this.getSchema(schemaName);
    if (!schema) {
      throw new Error(`Schema '${schemaName}' not found`);
    }
    return this.validateValue(schema, value);
  }

  /**
   * Validate a schema definition
   * @param schema Schema to validate
   */
  protected abstract validateSchema(schema: ConfigSchema): Promise<void>;

  /**
   * Validate a value against a schema
   * @param schema Schema to validate against
   * @param value Value to validate
   */
  protected abstract validateValue(schema: ConfigSchema, value: unknown): Promise<ValidationResult>;
}