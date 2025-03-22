import { EventEmitter } from 'events';
import { MessageDeliveryInfo, MessageOptions, MessagePayload, MessageTemplate } from './types/message.types';

/**
 * Interface defining the message contract for notifications
 */
export interface IMessage extends EventEmitter {
  /**
   * Get the unique identifier for this message
   */
  getId(): string;

  /**
   * Get the raw message payload
   */
  getPayload(): MessagePayload;

  /**
   * Get message delivery options
   */
  getOptions(): MessageOptions;

  /**
   * Set message delivery options
   */
  setOptions(options: Partial<MessageOptions>): void;

  /**
   * Get message delivery status
   */
  getDeliveryInfo(): MessageDeliveryInfo;

  /**
   * Events:
   * - 'delivery.status': Emitted when delivery status changes
   * - 'delivery.success': Emitted on successful delivery
   * - 'delivery.error': Emitted on delivery failure
   * - 'template.applied': Emitted when template is applied
   * - 'validation.error': Emitted on validation failure
   */

  /**
   * Apply a template to the message content
   */
  applyTemplate<T extends Record<string, unknown>>(template: MessageTemplate<T>): Promise<void>;

  /**
   * Validate message content and configuration
   */
  validate(): Promise<boolean>;

  /**
   * Clone this message with optional overrides
   */
  clone(overrides?: Partial<MessagePayload>): IMessage;

  /**
   * Serialize message for storage/transmission
   */
  serialize(): string;

  /**
   * Get message metadata
   */
  getMetadata(): Record<string, unknown>;

  /**
   * Set message metadata
   */
  setMetadata(metadata: Record<string, unknown>): void;
}