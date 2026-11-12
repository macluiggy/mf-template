import type { Provider } from '@angular/core';
import { Injectable } from '@angular/core';

/**
 * User-feedback port: the loader and the toasts.
 *
 * The app depends on this port, never on a host bus. The default adapter
 * writes to the console; `provideNeocoreHost()` replaces it with the host's
 * PubSub topics. Removing the integration is one provider swap.
 */
export abstract class Notifier {
  /** Shows or hides the global loader. */
  abstract loading(active: boolean): void;

  /** Reports something that worked. */
  abstract success(message: string): void;

  /** Reports a failure the user should read. */
  abstract error(message: string): void;

  /** Reports something the user should check. */
  abstract warning(message: string): void;

  /** Reports neutral information. */
  abstract info(message: string): void;
}

/**
 * Default adapter: logs through the console. There is no global loader outside
 * a host, so `loading()` is a no-op.
 */
@Injectable()
export class ConsoleNotifier extends Notifier {
  error(message: string): void {
    console.error(message);
  }

  info(message: string): void {
    console.info(message);
  }

  loading(_active: boolean): void {
    // No host, no global loader: nothing to show.
  }

  success(message: string): void {
    console.info(message);
  }

  warning(message: string): void {
    console.warn(message);
  }
}

/** Binds the console adapter to the {@link Notifier} port. */
export function provideConsoleNotifier(): Provider {
  return { provide: Notifier, useClass: ConsoleNotifier };
}
