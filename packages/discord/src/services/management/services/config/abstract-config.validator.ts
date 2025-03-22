import { ConfigSchema, ValidationResult } from '../../interfaces/config/types';
import { IConfigValidator } from '../../interfaces/config/config-validator.interface';

/**
 * Abstract base class for configuration validators
 * Provides schema management and basic validation infrastructure
 */
export abstract class AbstractConfigValidator implements IConfigValidator {
  protected readonly _schemas: Map<string, ConfigSchema>;

  constructor() {
    this._schemas = new Map();
  }

  public async addSchema(name: string, schema: ConfigSchema): Promise<void> {
    if (this._schemas.has(name)) {
      throw new Error(`Schema '${name}' already exists`);
    }

    await this.validateSchema(schema);
    await this.compileSchema(name, schema);
    this._schemas.set(name, schema);
  }

  public async removeSchema(name: string): Promise<void> {
    if (!this._schemas.has(name)) {
      throw new Error(`Schema '${name}' not found`);
    }

    await this.uncompileSchema(name);
    this._schemas.delete(name);
  }

  public async getSchema(name: string): Promise<ConfigSchema | undefined> {
    return this._schemas.get(name);
  }

  public async validate(schemaName: string, value: unknown): Promise<ValidationResult> {
    const schema = await this.getSchema(schemaName);
    if (!schema) {
      throw new Error(`Schema '${schemaName}' not found`);
    }

    return this.validateValue(schemaName, value);
  }

  public async hasSchema(name: string): Promise<boolean> {
    return this._schemas.has(name);
  }

  public async getSchemaNames(): Promise<string[]> {
    return Array.from(this._schemas.keys());
  }

  public async dispose(): Promise<void> {
    for (const name of this._schemas.keys()) {
      await this.uncompileSchema(name);
    }
    this._schemas.clear();
  }

  /**
   * Validate that a schema definition is valid
   * Must be implemented by specific validator implementations
   */
  protected abstract validateSchema(schema: ConfigSchema): Promise<void>;

  /**
   * Compile a schema for validation
   * Must be implemented by specific validator implementations
   */
  protected abstract compileSchema(name: string, schema: ConfigSchema): Promise<void>;

  /**
   * Remove a compiled schema
   * Must be implemented by specific validator implementations
   */
  protected abstract uncompileSchema(name: string): Promise<void>;

  /**
   * Validate a value against a compiled schema
   * Must be implemented by specific validator implementations
   */
  protected abstract validateValue(schemaName: string, value: unknown): Promise<ValidationResult>;
}