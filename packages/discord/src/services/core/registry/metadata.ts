import { Constructor } from "../../../types";
import { IMetadataStorage } from "./interfaces/metadata.interface";

/**
 * Class voor het opslaan en beheren van service metadata
 */
export class MetadataStorage implements IMetadataStorage {
  private readonly storage = new Map<symbol, Map<Constructor, any>>();

  /**
   * Singleton instance
   */
  private static instance: MetadataStorage;

  private constructor() {}

  /**
   * Krijg de singleton instance
   */
  public static getInstance(): MetadataStorage {
    if (!MetadataStorage.instance) {
      MetadataStorage.instance = new MetadataStorage();
    }
    return MetadataStorage.instance;
  }

  /**
   * Haal alle metadata op voor een bepaalde key
   */
  public getMetadata<T = any>(key: symbol): Map<Constructor, T> {
    if (!this.storage.has(key)) {
      this.storage.set(key, new Map());
    }
    return this.storage.get(key)!;
  }

  /**
   * Haal metadata op voor een specifieke target
   */
  public getTargetMetadata<T = any>(
    key: symbol,
    target: Constructor
  ): T | undefined {
    const metadata = this.getMetadata<T>(key);
    return metadata.get(target);
  }

  /**
   * Sla metadata op
   */
  public setMetadata<T = any>(
    key: symbol,
    target: Constructor,
    metadata: T
  ): void {
    const storage = this.getMetadata<T>(key);
    storage.set(target, metadata);
  }

  /**
   * Verwijder metadata
   */
  public deleteMetadata(key: symbol, target: Constructor): void {
    const metadata = this.getMetadata(key);
    metadata.delete(target);
  }

  /**
   * Controleer of metadata bestaat
   */
  public hasMetadata(key: symbol, target: Constructor): boolean {
    return this.getMetadata(key).has(target);
  }

  /**
   * Merge bestaande metadata met nieuwe metadata
   */
  public mergeMetadata<T extends Record<string, any>>(
    key: symbol,
    target: Constructor,
    metadata: Partial<T>
  ): void {
    const existing = this.getTargetMetadata<T>(key, target) || {} as T;
    this.setMetadata(key, target, {
      ...existing,
      ...metadata
    });
  }

  /**
   * Reset alle opgeslagen metadata
   * (Vooral nuttig voor testing)
   */
  public reset(): void {
    this.storage.clear();
  }
}