import { Injectable, inject } from '@angular/core';
import { Observable, defer, finalize } from 'rxjs';

import { PubSubService } from './pubsub.service';

/**
 * Reference-counts the operations in flight and drives the host's global
 * loader through the PubSub `loading` topic.
 *
 * The host shows a single global loader, so publishing `loading(false)` while
 * another operation is still running hides it too early. This service counts
 * the active operations and only publishes `loading(false)` when the last one
 * finishes (complete, error or unsubscribe).
 *
 * @example
 * ```ts
 * // The loader stays on until every tracked request finishes.
 * this.service.list().pipe(this.loading.track).subscribe();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class LoadingTrackerService {
  private readonly pubSub = inject(PubSubService);
  private counter = 0;

  /**
   * Registers an operation in flight and returns its `stop` function.
   *
   * The loader is published on the 0 -> 1 transition only. The returned
   * function is idempotent (calling it twice decrements the counter once) and
   * publishes `loading(false)` on the 1 -> 0 transition only.
   */
  start(): () => void {
    this.counter += 1;
    if (this.counter === 1) {
      this.pubSub.loading(true);
    }

    let stopped = false;
    return () => {
      if (stopped) {
        return;
      }
      stopped = true;
      this.counter = Math.max(0, this.counter - 1);
      if (this.counter === 0) {
        this.pubSub.loading(false);
      }
    };
  }

  /**
   * Wraps an observable so the loader is on while it runs: it starts on
   * subscribe and stops on complete, error or unsubscribe.
   *
   * It is an arrow function (not a method) so it can be used directly as a
   * pipe operator without losing its `this`.
   */
  readonly track = <T>(source: Observable<T>): Observable<T> =>
    defer(() => {
      const stop = this.start();
      return source.pipe(finalize(stop));
    });

  /** True while at least one tracked operation is running. */
  get active(): boolean {
    return this.counter > 0;
  }
}
