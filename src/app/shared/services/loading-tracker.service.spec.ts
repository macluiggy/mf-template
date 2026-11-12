import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { provideNotifierMock } from '../../../testing';
import { Notifier } from '../../core/notifier';
import { LoadingTrackerService } from './loading-tracker.service';

describe('LoadingTrackerService', () => {
  let service: LoadingTrackerService;
  let notifier: Notifier;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: provideNotifierMock().providers,
    });
    service = TestBed.inject(LoadingTrackerService);
    notifier = TestBed.inject(Notifier);
  });

  afterEach(() => vi.clearAllMocks());

  it('reports loading(true) on subscribe and loading(false) on completion', () => {
    const source = new Subject<string>();

    source.pipe(service.track).subscribe();
    expect(notifier.loading).toHaveBeenCalledTimes(1);
    expect(notifier.loading).toHaveBeenCalledWith(true);

    source.next('first');
    source.complete();
    expect(notifier.loading).toHaveBeenCalledTimes(2);
    expect(notifier.loading).toHaveBeenLastCalledWith(false);
    expect(service.active).toBe(false);
  });

  it('keeps the loader on until every tracked operation finishes', () => {
    const first = new Subject<string>();
    const second = new Subject<string>();

    first.pipe(service.track).subscribe();
    second.pipe(service.track).subscribe();

    // The loader is reported once, not once per operation.
    expect(notifier.loading).toHaveBeenCalledTimes(1);
    expect(notifier.loading).toHaveBeenCalledWith(true);
    expect(service.active).toBe(true);

    first.complete();
    expect(notifier.loading).toHaveBeenCalledTimes(1);
    expect(service.active).toBe(true);

    second.complete();
    expect(notifier.loading).toHaveBeenCalledTimes(2);
    expect(notifier.loading).toHaveBeenLastCalledWith(false);
    expect(service.active).toBe(false);
  });

  it('stops the loader when the tracked source fails', () => {
    const source = new Subject<string>();

    source.pipe(service.track).subscribe({ error: () => undefined });
    expect(notifier.loading).toHaveBeenCalledWith(true);

    source.error(new Error('boom'));
    expect(notifier.loading).toHaveBeenCalledTimes(2);
    expect(notifier.loading).toHaveBeenLastCalledWith(false);
    expect(service.active).toBe(false);
  });

  it('stops the loader when the subscription is cancelled', () => {
    const source = new Subject<string>();

    const subscription = source.pipe(service.track).subscribe();
    expect(notifier.loading).toHaveBeenCalledWith(true);

    subscription.unsubscribe();
    expect(notifier.loading).toHaveBeenCalledTimes(2);
    expect(notifier.loading).toHaveBeenLastCalledWith(false);
    expect(service.active).toBe(false);
  });

  it('decrements the counter once when stop is called twice', () => {
    const stop = service.start();

    expect(service.active).toBe(true);
    stop();
    stop();

    expect(service.active).toBe(false);
    expect(notifier.loading).toHaveBeenCalledTimes(2);
    expect(notifier.loading).toHaveBeenNthCalledWith(1, true);
    expect(notifier.loading).toHaveBeenNthCalledWith(2, false);
  });

  it('never lets the counter go below zero', () => {
    const stop = service.start();

    stop();
    stop();

    expect(service.active).toBe(false);
    expect(notifier.loading).toHaveBeenCalledTimes(2);
  });
});
