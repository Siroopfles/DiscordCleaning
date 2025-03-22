/**
 * Configuratie validatie schema
 */
export interface ConfigSchema {
  type: string;
  properties?: Record<string, ConfigSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Configuratie schema property definitie
 */
export interface ConfigSchemaProperty {
  type: string;
  description?: string;
  default?: any;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  format?: string;
}

/**
 * Configuratie wijziging callback
 */
export type ConfigChangeCallback = (
  key: string,
  newValue: any,
  oldValue: any
) => void | Promise<void>;

/**
 * Basis configuratie service interface
 */
export interface IConfigService {
  /**
   * Haalt een configuratie waarde op
   */
  get<T>(key: string): Promise<T>;

  /**
   * Zet een configuratie waarde
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Controleert of een configuratie key bestaat
   */
  has(key: string): Promise<boolean>;

  /**
   * Verwijdert een configuratie key
   */
  remove(key: string): Promise<void>;

  /**
   * Valideert configuratie tegen schema
   */
  validate(schema: ConfigSchema): Promise<boolean>;

  /**
   * Herlaadt configuratie van bron
   */
  reload(): Promise<void>;

  /**
   * Haalt alle configuratie op als object
   */
  getAll(): Promise<Record<string, any>>;

  /**
   * Registreert configuratie wijziging listener
   */
  onConfigChange(callback: ConfigChangeCallback): void;

  /**
   * Verwijdert configuratie wijziging listener
   */
  removeChangeListener(callback: ConfigChangeCallback): void;
}