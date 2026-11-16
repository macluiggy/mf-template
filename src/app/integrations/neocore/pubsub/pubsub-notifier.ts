import { Injectable, inject } from '@angular/core';

import { Notifier } from '../../../core/notifier';
import { PubSubService } from './pubsub.service';

/**
 * NEOCORE adapter for {@link Notifier}: publishes each notification on the
 * host's PubSub topics, which is how the host shows its loader and toasts.
 */
@Injectable()
export class PubSubNotifier extends Notifier {
  private readonly pubSub = inject(PubSubService);

  error(message: string): void {
    this.pubSub.error(message);
  }

  info(message: string): void {
    this.pubSub.info(message);
  }

  loading(active: boolean): void {
    this.pubSub.loading(active);
  }

  success(message: string): void {
    this.pubSub.success(message);
  }

  warning(message: string): void {
    this.pubSub.warning(message);
  }
}
