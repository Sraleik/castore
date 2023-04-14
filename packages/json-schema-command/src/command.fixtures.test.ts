/* eslint-disable max-lines */
import { vi } from 'vitest';

import {
  EventStore,
  EventType,
  EventTypeDetail,
  StorageAdapter,
  tuple,
} from '@castore/core';

import { JSONSchemaCommand } from './command';

export const pushEventMock = vi.fn();
export const groupEvent = vi.fn();
export const getEventsMock = vi.fn();
export const listAggregateIdsMock = vi.fn();
export const putSnapshotMock = vi.fn();
export const getLastSnapshotMock = vi.fn();
export const listSnapshotsMock = vi.fn();

export const mockStorageAdapter: StorageAdapter = {
  pushEvent: pushEventMock,
  groupEvent: groupEvent,
  getEvents: getEventsMock,
  listAggregateIds: listAggregateIdsMock,
  putSnapshot: putSnapshotMock,
  getLastSnapshot: getLastSnapshotMock,
  listSnapshots: listSnapshotsMock,
};

export const counterCreatedEvent = new EventType<'COUNTER_CREATED'>({
  type: 'COUNTER_CREATED',
});
export const counterIncrementedEvent = new EventType<'COUNTER_INCREMENTED'>({
  type: 'COUNTER_INCREMENTED',
});
export const counterDeletedEvent = new EventType<'COUNTER_DELETED'>({
  type: 'COUNTER_DELETED',
});
export type CounterEventsDetails =
  | EventTypeDetail<typeof counterCreatedEvent>
  | EventTypeDetail<typeof counterIncrementedEvent>
  | EventTypeDetail<typeof counterDeletedEvent>;

export type CounterAggregate = {
  aggregateId: string;
  version: number;
  count: number;
  status: string;
};

export const counterIdMock = 'counterId';
export const counterEventsMocks: [CounterEventsDetails, CounterEventsDetails] =
  [
    {
      aggregateId: counterIdMock,
      version: 1,
      type: 'COUNTER_CREATED',
      timestamp: '2022',
    },
    {
      aggregateId: counterIdMock,
      version: 2,
      type: 'COUNTER_INCREMENTED',
      timestamp: '2023',
    },
  ];

export const countersReducer = (
  counterAggregate: CounterAggregate,
  event: CounterEventsDetails,
): CounterAggregate => {
  const { version, aggregateId } = event;
  switch (event.type) {
    case 'COUNTER_CREATED':
      return { aggregateId, version: event.version, count: 0, status: 'LIVE' };
    case 'COUNTER_INCREMENTED':
      return {
        ...counterAggregate,
        version,
        count: counterAggregate.count + 1,
      };
    case 'COUNTER_DELETED':
      return { ...counterAggregate, version, status: 'DELETED' };
    default: {
      return { ...counterAggregate, version };
    }
  }
};

export const counterEventStore = new EventStore({
  eventStoreId: 'Counters',
  eventStoreEvents: [
    counterCreatedEvent,
    counterIncrementedEvent,
    counterDeletedEvent,
  ],
  reduce: countersReducer,
  storageAdapter: mockStorageAdapter,
});

export const inputSchema = {
  type: 'object',
  properties: {
    counterId: { type: 'string' },
  },
  required: ['counterId'],
  additionalProperties: false,
} as const;

export const outputSchema = {
  type: 'object',
  properties: {
    nextCount: { type: 'integer' },
  },
  required: ['nextCount'],
  additionalProperties: false,
} as const;

export const requiredEventStores = tuple(counterEventStore);

export const createCounter = new JSONSchemaCommand({
  commandId: 'CREATE_COUNTER',
  requiredEventStores: tuple(counterEventStore),
  outputSchema: inputSchema,
  handler: async (
    _,
    [countersStore],
    { generateUuid }: { generateUuid: () => string },
  ) => {
    const counterId = generateUuid();

    await countersStore.pushEvent({
      aggregateId: counterId,
      type: 'COUNTER_CREATED',
      version: 1,
    });

    return { counterId };
  },
});

export const incrementCounter = new JSONSchemaCommand({
  commandId: 'INCREMENT_COUNTER',
  requiredEventStores,
  inputSchema,
  outputSchema,
  handler: async (input, eventStores) => {
    const { counterId } = input;
    const [countersStore] = eventStores;

    const { aggregate } = await countersStore.getExistingAggregate(counterId);
    const { count, version } = aggregate;

    await countersStore.pushEvent({
      aggregateId: counterId,
      version: version + 1,
      type: 'COUNTER_INCREMENTED',
    });

    return { nextCount: count + 1 };
  },
});

export const incrementCounterNoOutput = new JSONSchemaCommand({
  commandId: 'INCREMENT_COUNTER_NO_OUTPUT',
  requiredEventStores: tuple(counterEventStore),
  inputSchema,
  handler: async (input, eventStores) => {
    const { counterId } = input;
    const [countersStore] = eventStores;

    const { aggregate } = await countersStore.getExistingAggregate(counterId);
    const { version } = aggregate;

    await countersStore.pushEvent({
      aggregateId: counterId,
      type: 'COUNTER_INCREMENTED',
      version: version + 1,
    });
  },
});

export const incrementCounterA = new JSONSchemaCommand({
  commandId: 'INCREMENT_COUNTER_A',
  requiredEventStores: tuple(counterEventStore),
  outputSchema,
  handler: async (_, eventStores) => {
    const counterId = 'A';
    const [countersStore] = eventStores;

    const { aggregate } = await countersStore.getExistingAggregate(counterId);
    const { count, version } = aggregate;

    await countersStore.pushEvent({
      aggregateId: counterId,
      type: 'COUNTER_INCREMENTED',
      version: version + 1,
    });

    return { nextCount: count + 1 };
  },
});

export const incrementCounterANoOutput = new JSONSchemaCommand({
  commandId: 'INCREMENT_COUNTER_A_NO_OUTPUT',
  requiredEventStores: tuple(counterEventStore),
  handler: async (_, eventStores) => {
    const counterId = 'A';
    const [countersStore] = eventStores;

    const { aggregate } = await countersStore.getExistingAggregate(counterId);
    const { version } = aggregate;

    await countersStore.pushEvent({
      aggregateId: counterId,
      type: 'COUNTER_INCREMENTED',
      version: version + 1,
    });
  },
});
