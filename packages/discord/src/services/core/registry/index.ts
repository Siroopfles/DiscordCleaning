// Re-export public interfaces
export {
  IServiceContainer,
  ServiceRegistration,
  ServiceScope
} from './interfaces/container.interface';

export {
  ServiceDecoratorOptions,
  ServiceMetadata,
  SERVICE_METADATA_KEY,
  INJECT_METADATA_KEY
} from './interfaces/decorator.interface';

export {
  IMetadataStorage,
  PropertyMetadata,
  ParameterMetadata,
  DependencyMetadata,
  PROPERTY_METADATA_KEY,
  PARAMETER_METADATA_KEY,
  CONFIG_TYPE_METADATA_KEY,
  DEPS_TYPE_METADATA_KEY
} from './interfaces/metadata.interface';

// Re-export implementations
export { ServiceContainer } from './container';
export { MetadataStorage } from './metadata';

// Re-export decorators
export {
  Service,
  Inject,
  InjectParam,
  ConfigType,
  DepsType
} from './decorators';