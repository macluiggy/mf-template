import { Injectable, inject } from '@angular/core';
import { Observable, defer, finalize } from 'rxjs';

import { Notifier } from '../../core/notifier';

/**
 * Reference-counts the operations in flight and drives the global loader
 * through the `Notifier` port.
 *
 * A host shows a single global loader, so publishing `loading(false)` while
 * another operation is still running hides it too early. This service counts
 * the active operations and only reports `loading(false)` when the last one
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
  private readonly notifier = inject(Notifier);
  private counter = 0;

  /**
   * Registers an operation in flight and returns its `stop` function.
   *
   * The loader is reported on the 0 -> 1 transition only. The returned
   * function is idempotent (calling it twice decrements the counter once) and
   * reports `loading(false)` on the 1 -> 0 transition only.
   */
  start(): () => void {
    this.counter += 1;
    if (this.counter === 1) {
      this.notifier.loading(true);
    }

    let stopped = false;
    return () => {
      if (stopped) {
        return;
      }
      stopped = true;
      this.counter = Math.max(0, this.counter - 1);
      if (this.counter === 0) {
        this.notifier.loading(false);
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
