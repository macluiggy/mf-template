import { TestBed } from '@angular/core/testing';

import { ConsoleNotifier, Notifier, provideConsoleNotifier } from './notifier';

describe('ConsoleNotifier', () => {
  let notifier: ConsoleNotifier;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    notifier = new ConsoleNotifier();
  });

  afterEach(() => vi.restoreAllMocks());

  it('logs a success and info through console.info', () => {
    notifier.success('saved');
    notifier.info('hello');

    expect(console.info).toHaveBeenNthCalledWith(1, 'saved');
    expect(console.info).toHaveBeenNthCalledWith(2, 'hello');
  });

  it('logs a warning through console.warn', () => {
    notifier.warning('careful');

    expect(console.warn).toHaveBeenCalledWith('careful');
  });

  it('logs an error through console.error', () => {
    notifier.error('boom');

    expect(console.error).toHaveBeenCalledWith('boom');
  });

  it('ignores loading: there is no global loader outside a host', () => {
    notifier.loading(true);
    notifier.loading(false);

    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });
});

describe('provideConsoleNotifier', () => {
  it('binds the console adapter to the Notifier port', () => {
    TestBed.configureTestingModule({
      providers: [provideConsoleNotifier()],
    });

    expect(TestBed.inject(Notifier)).toBeInstanceOf(ConsoleNotifier);
  });
});
