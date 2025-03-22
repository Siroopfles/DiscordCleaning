import { ConfigSchema, ValidationResult } from './types';

/**
 * Interface for configuration validators
 * Handles schema-based validation of configuration values
 */
export interface IConfigValidator {
  /**
   * Add a schema to the validator
   * @param name Schema name/identifier
   * @param schema JSON Schema definition
   */
  addSchema(name: string, schema: ConfigSchema): Promise<void>;

  /**
   * Remove a schema from the validator
   * @param name Schema name/identifier
   */
  removeSchema(name: string): Promise<void>;

  /**
   * Get a registered schema
   * @param name Schema name/identifier
   */
  getSchema(name: string): Promise<ConfigSchema | undefined>;

  /**
   * Validate a value against a schema
   * @param schemaName Schema name/identifier
   * @param value Value to validate
   */
  validate(schemaName: string, value: unknown): Promise<ValidationResult>;

  /**
   * Check if a schema exists
   * @param name Schema name/identifier
   */
  hasSchema(name: string): Promise<boolean>;

  /**
   * Get all registered schema names
   */
  getSchemaNames(): Promise<string[]>;

  /**
   * Clean up validator resources
   */
  dispose(): Promise<void>;
}