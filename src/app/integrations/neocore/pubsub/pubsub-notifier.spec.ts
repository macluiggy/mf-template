import { TestBed } from '@angular/core/testing';

import { createPubSubMock, providePubSubMock } from '../testing/pubsub.mock';
import { PubSubNotifier } from './pubsub-notifier';

describe('PubSubNotifier', () => {
  const pubsub = createPubSubMock();
  let notifier: PubSubNotifier;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [PubSubNotifier, ...providePubSubMock(pubsub).providers],
    });
    notifier = TestBed.inject(PubSubNotifier);
  });

  it('publishes the loader state on the loading topic', () => {
    notifier.loading(true);
    notifier.loading(false);

    expect(pubsub.loading).toHaveBeenNthCalledWith(1, true);
    expect(pubsub.loading).toHaveBeenNthCalledWith(2, false);
  });

  it('publishes each toast on its topic', () => {
    notifier.success('ok');
    notifier.error('boom');
    notifier.warning('careful');
    notifier.info('hello');

    expect(pubsub.success).toHaveBeenCalledWith('ok');
    expect(pubsub.error).toHaveBeenCalledWith('boom');
    expect(pubsub.warning).toHaveBeenCalledWith('careful');
    expect(pubsub.info).toHaveBeenCalledWith('hello');
  });
});
