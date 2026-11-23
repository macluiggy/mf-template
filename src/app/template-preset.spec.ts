import { TestBed } from '@angular/core/testing';

import { environment } from '../environments/environment';
import { provideAppCore } from './core/app-core.providers';
import {
  KeyValueStorage,
  LocalStorageKeyValueStorage,
} from './core/key-value-storage';
import { ConsoleNotifier, Notifier } from './core/notifier';
import { PubSubNotifier } from './integrations/neocore/pubsub/pubsub-notifier';
import { EncryptedKeyValueStorage } from './integrations/neocore/storage/encrypted-key-value-storage';
import { provideTemplatePreset } from './template-preset';

// The NEOCORE preset is optional, so the spec brings its own secret instead of
// relying on SECRET_KEY in .env (`bun run test` reads only .env.example).
const TEST_SECRET_KEY = 'test-secret-key-neocore';

describe('provideTemplatePreset', () => {
  it('keeps the core defaults bound with generic', () => {
    TestBed.configureTestingModule({
      providers: [provideAppCore(), provideTemplatePreset('generic')],
    });

    expect(TestBed.inject(Notifier)).toBeInstanceOf(ConsoleNotifier);
    expect(TestBed.inject(KeyValueStorage)).toBeInstanceOf(
      LocalStorageKeyValueStorage,
    );
  });

  it('binds the NEOCORE adapters with neocore', () => {
    environment.secretKey = TEST_SECRET_KEY;
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideAppCore(), provideTemplatePreset('neocore')],
    });

    expect(TestBed.inject(Notifier)).toBeInstanceOf(PubSubNotifier);
    expect(TestBed.inject(KeyValueStorage)).toBeInstanceOf(
      EncryptedKeyValueStorage,
    );
  });
});
