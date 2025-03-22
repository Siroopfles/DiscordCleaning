import 'reflect-metadata';
import { Constructor } from '../../../types';
import { IBaseService } from '../interfaces/base/service.interface';
import {
  ServiceDecoratorOptions,
  ServiceMetadata,
  SERVICE_METADATA_KEY,
  INJECT_METADATA_KEY
} from './interfaces/decorator.interface';
import { ServiceScope } from './interfaces/container.interface';
import {
  PropertyMetadata,
  ParameterMetadata,
  PROPERTY_METADATA_KEY,
  PARAMETER_METADATA_KEY,
  CONFIG_TYPE_METADATA_KEY,
  DEPS_TYPE_METADATA_KEY
} from './interfaces/metadata.interface';
import { MetadataStorage } from './metadata';

/**
 * Service decorator factory
 */
export function Service(options: ServiceDecoratorOptions = {}): ClassDecorator {
  return (target: Function) => {
    const metadata: ServiceMetadata = {
      ctor: target as Constructor<IBaseService>,
      scope: options.scope || ServiceScope.SINGLETON,
      tokens: options.tokens || [Symbol(target.name)],
      name: options.name || target.name
    };

    // Sla service metadata op
    MetadataStorage.getInstance().setMetadata(
      SERVICE_METADATA_KEY,
      target as Constructor,
      metadata
    );

    // Haal parameter types op via reflection
    const paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
    
    // Sla parameter metadata op
    const parameters: ParameterMetadata[] = paramTypes.map((type: any, index: number) => ({
      index,
      type: type as Constructor,
      isOptional: false // Default niet optioneel
    }));

    MetadataStorage.getInstance().setMetadata(
      PARAMETER_METADATA_KEY,
      target as Constructor,
      parameters
    );
  };
}

/**
 * Property injection decorator
 */
export function Inject(
  token?: symbol | Constructor,
  options: { optional?: boolean } = {}
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    // Haal property type op via reflection
    const type = Reflect.getMetadata('design:type', target, propertyKey);
    
    const metadata: PropertyMetadata = {
      propertyKey,
      type: token || type,
      isOptional: options.optional || false
    };

    // Merge met bestaande property metadata
    const storage = MetadataStorage.getInstance();
    const existingMetadata = storage.getTargetMetadata<PropertyMetadata[]>(
      PROPERTY_METADATA_KEY,
      target.constructor as Constructor
    ) || [];

    storage.setMetadata(
      PROPERTY_METADATA_KEY,
      target.constructor as Constructor,
      [...existingMetadata, metadata]
    );
  };
}

/**
 * Parameter injection decorator 
 */
export function InjectParam(
  token?: symbol | Constructor,
  options: { optional?: boolean } = {}
): ParameterDecorator {
  return (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) => {
    // Voor constructor parameters (_propertyKey is undefined)
    const paramTypes = Reflect.getMetadata('design:paramtypes', target);
    const type = token || (paramTypes && paramTypes[parameterIndex]);

    const metadata: ParameterMetadata = {
      index: parameterIndex,
      type,
      isOptional: options.optional || false
    };

    // Merge met bestaande parameter metadata
    const storage = MetadataStorage.getInstance();
    const existingMetadata = storage.getTargetMetadata<ParameterMetadata[]>(
      PARAMETER_METADATA_KEY,
      target.constructor as Constructor
    ) || [];

    storage.setMetadata(
      PARAMETER_METADATA_KEY,
      target.constructor as Constructor,
      [...existingMetadata, metadata]
    );
  };
}

/**
 * Config type decorator
 */
export function ConfigType(type: Constructor): ClassDecorator {
  return (target: Function) => {
    MetadataStorage.getInstance().setMetadata(
      CONFIG_TYPE_METADATA_KEY,
      target as Constructor,
      type
    );
  };
}

/**
 * Dependencies type decorator
 */
export function DepsType(type: Constructor): ClassDecorator {
  return (target: Function) => {
    MetadataStorage.getInstance().setMetadata(
      DEPS_TYPE_METADATA_KEY,
      target as Constructor,
      type
    );
  };
}