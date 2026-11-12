import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { LoadingTrackerService } from './loading-tracker.service';
import { PubSubService } from './pubsub.service';

describe('LoadingTrackerService', () => {
  let service: LoadingTrackerService;
  let pubSub: PubSubService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingTrackerService);
    pubSub = TestBed.inject(PubSubService);
  });

  afterEach(() => vi.restoreAllMocks());

  it('publishes loading(true) on subscribe and loading(false) on completion', () => {
    const loading = vi
      .spyOn(pubSub, 'loading')
      .mockImplementation(() => undefined);
    const source = new Subject<string>();

    source.pipe(service.track).subscribe();
    expect(loading).toHaveBeenCalledTimes(1);
    expect(loading).toHaveBeenCalledWith(true);

    source.next('first');
    source.complete();
    expect(loading).toHaveBeenCalledTimes(2);
    expect(loading).toHaveBeenLastCalledWith(false);
    expect(service.active).toBe(false);
  });

  it('keeps the loader on until every tracked operation finishes', () => {
    const loading = vi
      .spyOn(pubSub, 'loading')
      .mockImplementation(() => undefined);
    const first = new Subject<string>();
    const second = new Subject<string>();

    first.pipe(service.track).subscribe();
    second.pipe(service.track).subscribe();

    // The loader is published once, not once per operation.
    expect(loading).toHaveBeenCalledTimes(1);
    expect(loading).toHaveBeenCalledWith(true);
    expect(service.active).toBe(true);

    first.complete();
    expect(loading).toHaveBeenCalledTimes(1);
    expect(service.active).toBe(true);

    second.complete();
    expect(loading).toHaveBeenCalledTimes(2);
    expect(loading).toHaveBeenLastCalledWith(false);
    expect(service.active).toBe(false);
  });

  it('stops the loader when the tracked source fails', () => {
    const loading = vi
      .spyOn(pubSub, 'loading')
      .mockImplementation(() => undefined);
    const source = new Subject<string>();

    source.pipe(service.track).subscribe({ error: () => undefined });
    expect(loading).toHaveBeenCalledWith(true);

    source.error(new Error('boom'));
    expect(loading).toHaveBeenCalledTimes(2);
    expect(loading).toHaveBeenLastCalledWith(false);
    expect(service.active).toBe(false);
  });

  it('stops the loader when the subscription is cancelled', () => {
    const loading = vi
      .spyOn(pubSub, 'loading')
      .mockImplementation(() => undefined);
    const source = new Subject<string>();

    const subscription = source.pipe(service.track).subscribe();
    expect(loading).toHaveBeenCalledWith(true);

    subscription.unsubscribe();
    expect(loading).toHaveBeenCalledTimes(2);
    expect(loading).toHaveBeenLastCalledWith(false);
    expect(service.active).toBe(false);
  });

  it('decrements the counter once when stop is called twice', () => {
    const loading = vi
      .spyOn(pubSub, 'loading')
      .mockImplementation(() => undefined);
    const stop = service.start();

    expect(service.active).toBe(true);
    stop();
    stop();

    expect(service.active).toBe(false);
    expect(loading).toHaveBeenCalledTimes(2);
    expect(loading).toHaveBeenNthCalledWith(1, true);
    expect(loading).toHaveBeenNthCalledWith(2, false);
  });

  it('never lets the counter go below zero', () => {
    const loading = vi
      .spyOn(pubSub, 'loading')
      .mockImplementation(() => undefined);
    const stop = service.start();

    stop();
    stop();

    expect(service.active).toBe(false);
    expect(loading).toHaveBeenCalledTimes(2);
  });
});
