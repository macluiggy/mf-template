import { Injectable } from '@angular/core';
import PubSub from 'pubsub-js';

import { PubSubTopic } from './pubsub-topic.enum';

interface PublishOptions {
  /** Deliver synchronously (useful in tests). Defaults to async, like the host. */
  sync?: boolean;
}

/**
 * NEOCORE adapter: thin typed wrapper over pubsub-js for the host contract
 * described in {@link PubSubTopic}. Remotes must not subscribe to host UI
 * topics.
 *
 * Provided by `provideNeocoreHost()`; generic code uses the `Notifier` port.
 */
@Injectable()
export class PubSubService {
  publish(topic: PubSubTopic, data?: unknown): boolean {
    return PubSub.publish(topic, data);
  }

  publishSync(topic: PubSubTopic, data?: unknown): boolean {
    return PubSub.publishSync(topic, data);
  }

  loading(active: boolean, options?: PublishOptions): void {
    this.emit(PubSubTopic.LOADING, active, options);
  }

  success(message: string, options?: PublishOptions): void {
    this.emit(PubSubTopic.SUCCESS, message, options);
  }

  error(message: unknown, options?: PublishOptions): void {
    this.emit(PubSubTopic.ERROR, message, options);
  }

  warning(message: string, options?: PublishOptions): void {
    this.emit(PubSubTopic.WARNING, message, options);
  }

  info(message: string, options?: PublishOptions): void {
    this.emit(PubSubTopic.INFO, message, options);
  }

  private emit(
    topic: PubSubTopic,
    data: unknown,
    options?: PublishOptions,
  ): void {
    if (options?.sync) {
      this.publishSync(topic, data);
    } else {
      this.publish(topic, data);
    }
  }
}
