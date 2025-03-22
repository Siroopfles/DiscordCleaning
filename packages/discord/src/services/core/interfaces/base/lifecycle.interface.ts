/**
 * Definieert de lifecycle hooks voor services
 * 
 * @template TDependencies - Type voor service dependencies
 * @template TConfig - Type voor service configuratie
 */
export interface IServiceLifecycle<TDependencies = unknown, TConfig = unknown> {
  /**
   * Wordt aangeroepen tijdens service initialisatie
   * Gebruik dit voor setup van dependencies en resources
   */
  onInit?(): Promise<void>;

  /**
   * Wordt aangeroepen wanneer alle dependencies geïnitialiseerd zijn
   * Gebruik dit voor operaties die afhankelijk zijn van andere services
   */
  onReady?(): Promise<void>;

  /**
   * Wordt aangeroepen voor configuratie updates
   * @param config - Nieuwe service configuratie
   */
  onConfigUpdate?(config: Partial<TConfig>): Promise<void>;

  /**
   * Wordt aangeroepen voor dependency updates
   * @param dependencies - Nieuwe service dependencies
   */
  onDependenciesUpdate?(dependencies: Partial<TDependencies>): Promise<void>;
  
  /**
   * Wordt aangeroepen tijdens service shutdown
   * Gebruik dit voor cleanup van resources
   */
  onDestroy?(): Promise<void>;
}