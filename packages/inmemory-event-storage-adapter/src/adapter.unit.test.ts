import { randomUUID } from 'crypto';
import MockDate from 'mockdate';

import { InMemoryStorageAdapter } from './adapter';
import { InMemoryEventAlreadyExistsError } from './error';

const eventStoreIdMock = 'eventStoreIdMock';

const aggregateIdMock1 = randomUUID();
const aggregateIdMock2 = randomUUID();
const aggregateIdMock3 = randomUUID();
const aggregateIdMock4 = randomUUID();
const eventMock1 = {
  aggregateId: aggregateIdMock1,
  version: 1,
  type: 'EVENT_TYPE',
  timestamp: '2021-01-01T00:00:00.000Z',
};
const eventMock2 = {
  aggregateId: aggregateIdMock1,
  version: 2,
  type: 'EVENT_TYPE',
  timestamp: '2022-01-01T00:00:00.000Z',
};

describe('in-memory storage adapter', () => {
  describe('constructor', () => {
    const storageAdapter = new InMemoryStorageAdapter({
      initialEvents: [eventMock1, eventMock2],
    });

    it('fills the db with initial events', () => {
      expect(storageAdapter.eventStore).toStrictEqual({
        [aggregateIdMock1]: [eventMock1, eventMock2],
      });
    });
  });

  describe('methods', () => {
    const storageAdapter = new InMemoryStorageAdapter();

    it('gets an empty array if there is no event for aggregateId', async () => {
      const response = await storageAdapter.getEvents(aggregateIdMock1);
      expect(response).toStrictEqual({ events: [] });
    });

    it('throws an error if version already exists', async () => {
      const { timestamp, ...event } = eventMock1;
      MockDate.set(timestamp);
      await storageAdapter.pushEvent(event, {
        eventStoreId: eventStoreIdMock,
      });

      await expect(() =>
        storageAdapter.pushEvent(eventMock1, {
          eventStoreId: eventStoreIdMock,
        }),
      ).rejects.toThrow(InMemoryEventAlreadyExistsError);
    });

    it('pushes and gets events correctly', async () => {
      const { timestamp, ...event } = eventMock2;
      MockDate.set(timestamp);
      await storageAdapter.pushEvent(event, {
        eventStoreId: eventStoreIdMock,
      });

      const allEvents = await storageAdapter.getEvents(aggregateIdMock1);
      expect(allEvents).toStrictEqual({ events: [eventMock1, eventMock2] });

      const eventsMaxVersion = await storageAdapter.getEvents(
        aggregateIdMock1,
        { maxVersion: 1 },
      );
      expect(eventsMaxVersion).toStrictEqual({ events: [eventMock1] });

      const eventsMinVersion = await storageAdapter.getEvents(
        aggregateIdMock1,
        { minVersion: 2 },
      );
      expect(eventsMinVersion).toStrictEqual({ events: [eventMock2] });

      const eventsLimit = await storageAdapter.getEvents(aggregateIdMock1, {
        limit: 1,
      });
      expect(eventsLimit).toStrictEqual({ events: [eventMock1] });

      const eventsReverse = await storageAdapter.getEvents(aggregateIdMock1, {
        reverse: true,
      });
      expect(eventsReverse).toStrictEqual({ events: [eventMock2, eventMock1] });

      const eventsReverseAndLimit = await storageAdapter.getEvents(
        aggregateIdMock1,
        { limit: 1, reverse: true },
      );
      expect(eventsReverseAndLimit).toStrictEqual({ events: [eventMock2] });
    });

    it('list aggregate Ids', async () => {
      const aggregate2InitialEventTimestamp = '2022-01-01T00:00:00.000Z';
      MockDate.set(aggregate2InitialEventTimestamp);
      await storageAdapter.pushEvent(
        {
          version: 1,
          type: 'EVENT_TYPE',
          aggregateId: aggregateIdMock2,
        },
        { eventStoreId: eventStoreIdMock },
      );

      const aggregateIds = await storageAdapter.listAggregateIds();

      expect(aggregateIds).toStrictEqual({
        aggregateIds: [aggregateIdMock1, aggregateIdMock2],
      });
    });

    it('paginates aggregate Ids', async () => {
      const aggregate3InitialEventTimestamp = '2023-01-01T00:00:00.000Z';
      MockDate.set(aggregate3InitialEventTimestamp);
      await storageAdapter.pushEvent(
        {
          version: 1,
          type: 'EVENT_TYPE',
          aggregateId: aggregateIdMock3,
        },
        { eventStoreId: eventStoreIdMock },
      );

      const aggregate4InitialEventTimestamp = '2024-01-01T00:00:00.000Z';
      MockDate.set(aggregate4InitialEventTimestamp);
      await storageAdapter.pushEvent(
        {
          version: 1,
          type: 'EVENT_TYPE',
          aggregateId: aggregateIdMock4,
        },
        { eventStoreId: eventStoreIdMock },
      );

      const { aggregateIds, nextPageToken } =
        await storageAdapter.listAggregateIds({ limit: 2 });

      expect(aggregateIds).toStrictEqual([aggregateIdMock1, aggregateIdMock2]);
      expect(JSON.parse(nextPageToken as string)).toStrictEqual({
        limit: 2,
        lastEvaluatedKey: aggregateIdMock2,
      });

      const lastAggregateIds = await storageAdapter.listAggregateIds({
        pageToken: nextPageToken,
      });

      expect(lastAggregateIds).toStrictEqual({
        aggregateIds: [aggregateIdMock3, aggregateIdMock4],
      });
    });

    it('applies lisAggregateIds options', async () => {
      const { aggregateIds, nextPageToken } =
        await storageAdapter.listAggregateIds({
          limit: 1,
          initialEventAfter: '2021-02-01T00:00:00.000Z',
          initialEventBefore: '2023-02-01T00:00:00.000Z',
          reverse: true,
        });

      expect(aggregateIds).toStrictEqual([aggregateIdMock3]);
      expect(JSON.parse(nextPageToken as string)).toStrictEqual({
        limit: 1,
        initialEventAfter: '2021-02-01T00:00:00.000Z',
        initialEventBefore: '2023-02-01T00:00:00.000Z',
        reverse: true,
        lastEvaluatedKey: aggregateIdMock3,
      });

      const { aggregateIds: lastAggregateIds, nextPageToken: noPageToken } =
        await storageAdapter.listAggregateIds({
          pageToken: nextPageToken,
        });

      expect(noPageToken).toBeUndefined();
      expect(lastAggregateIds).toStrictEqual([aggregateIdMock2]);
    });
  });
});
