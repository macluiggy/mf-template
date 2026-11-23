import { TestBed } from '@angular/core/testing';

import { PubSubService } from '../pubsub/pubsub.service';
import { createPubSubMock, providePubSubMock } from './pubsub.mock';

describe('PubSub test doubles', () => {
  describe('createPubSubMock', () => {
    it('records what the page published to the host', () => {
      const pubsub = createPubSubMock();

      pubsub.loading(true);
      pubsub.error('boom');

      expect(pubsub.loading).toHaveBeenCalledWith(true);
      expect(pubsub.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('providePubSubMock', () => {
    it('replaces the pubsub service in the TestBed', () => {
      const { mock, providers } = providePubSubMock();

      TestBed.configureTestingModule({ providers });
      const service = TestBed.inject(PubSubService);

      service.loading(true);

      expect(mock.loading).toHaveBeenCalledWith(true);
    });
  });
});
