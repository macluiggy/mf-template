import { HttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { provideAppCore } from '../../core/app-core.providers';
import { AUTH_TOKEN_PROVIDER } from '../../core/auth-token';
import { KeyValueStorage } from '../../core/key-value-storage';
import { Notifier } from '../../core/notifier';
import { PermissionChecker } from '../../core/permission-checker';
import { provideAppHttpClient } from '../../shared/providers/http.providers';
import { provideNeocoreHost } from './neocore.providers';
import { NeocorePermissionChecker } from './permission/neocore-permission-checker';
import { PubSubNotifier } from './pubsub/pubsub-notifier';
import { EncryptedKeyValueStorage } from './storage/encrypted-key-value-storage';
import { StorageEnum } from './storage/storage.enum';

// The NEOCORE preset is optional, so the spec brings its own secret instead of
// relying on SECRET_KEY in .env (`bun run test` reads only .env.example).
const TEST_SECRET_KEY = 'test-secret-key-neocore';

describe('provideNeocoreHost', () => {
  beforeEach(() => {
    environment.secretKey = TEST_SECRET_KEY;
    localStorage.clear();
  });

  it('overrides every core default with the NEOCORE adapter', () => {
    TestBed.configureTestingModule({
      providers: [provideAppCore(), provideNeocoreHost()],
    });

    expect(TestBed.inject(Notifier)).toBeInstanceOf(PubSubNotifier);
    expect(TestBed.inject(KeyValueStorage)).toBeInstanceOf(
      EncryptedKeyValueStorage,
    );
    expect(TestBed.inject(PermissionChecker)).toBeInstanceOf(
      NeocorePermissionChecker,
    );
  });

  it('reads the host access token on every call', () => {
    TestBed.configureTestingModule({
      providers: [provideAppCore(), provideNeocoreHost()],
    });
    const tokenProvider = TestBed.inject(AUTH_TOKEN_PROVIDER);
    const storage = TestBed.inject(KeyValueStorage);

    expect(tokenProvider()).toBeNull();

    storage.set(StorageEnum.ACCESS_TOKEN, 'host-token');

    expect(tokenProvider()).toBe('host-token');
  });

  it('contributes the device info interceptor to the app HttpClient', () => {
    TestBed.configureTestingModule({
      providers: [
        provideAppCore(),
        provideAppHttpClient(),
        provideHttpClientTesting(),
        provideNeocoreHost(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);

    http.get('/api/resource').subscribe();
    const req = controller.expectOne('/api/resource');

    expect(req.request.headers.get('x-device-info')).toContain('userAgent');
    req.flush({});
    controller.verify();
  });
});
