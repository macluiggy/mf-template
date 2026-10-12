import { TestBed } from '@angular/core/testing';
import PubSub from 'pubsub-js';
import { PubSubTopic } from '../enums/pubsub-topic.enum';
import { PubSubService } from './pubsub.service';

describe('PubSubService', () => {
  let service: PubSubService;

  beforeEach(() => {
    PubSub.clearAllSubscriptions();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PubSubService);
  });

  it('uses the exact topic names the host subscribes to', () => {
    expect(PubSubTopic.LOADING).toBe('loading');
    expect(PubSubTopic.ERROR).toBe('error');
    expect(PubSubTopic.SUCCESS).toBe('success');
    expect(PubSubTopic.WARNING).toBe('warning');
    expect(PubSubTopic.INFO).toBe('info');
    expect(PubSubTopic.LOGIN_REDIRECT).toBe('login-redirect');
    expect(PubSubTopic.CLEAR_BREADCRUMB).toBe('clearBreadCrumb');
  });

  it('publishes a payload on a topic', () => {
    const received: unknown[] = [];
    PubSub.subscribe('success', (_topic, data) => received.push(data));

    service.publishSync(PubSubTopic.SUCCESS, 'Saved');

    expect(received).toEqual(['Saved']);
  });

  it('exposes notification shortcuts for the host toasts and loader', () => {
    const received: Array<[string, unknown]> = [];
    for (const topic of ['loading', 'error', 'success']) {
      PubSub.subscribe(topic, (name, data) => received.push([name as string, data]));
    }

    service.loading(true, { sync: true });
    service.success('ok', { sync: true });
    service.error('boom', { sync: true });

    expect(received).toEqual([
      ['loading', true],
      ['success', 'ok'],
      ['error', 'boom'],
    ]);
  });
});
