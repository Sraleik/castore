# Dam

Data maintenance & migration tooling for the [Castore](https://github.com/castore-dev/castore) library.

## 📥 Installation

```bash
# npm
npm install --save-dev @castore/dam

# yarn
yarn add --dev @castore/dam
```

This package has `@castore/core` as peer dependency, so you will have to install it as well:

```bash
# npm
npm install @castore/core

# yarn
yarn add @castore/core
```

## 👩‍💻 Usage

`@castore/dam` exposes a series of utils that scan past events and re-publish them in [message channels](https://github.com/castore-dev/castore#--event-driven-architecture) – or _"pour them"_ as in _"pouring water from a container to another"_ 🫗.

Those utils are typically very useful for data maintenance and migration, and can be rate limited to limit impact on production traffic. They are the following:

- [`pourEventStoreAggregateIds`](#poureventstoreaggregateids): Pour all the aggregate ids of an event store in an `AggregateExistsMessageChannel`.
- [`pourAggregateEvents`](#pouraggregateevents): Pour all the events of a specific aggregate in a provided `NotificationMessageChannel`.
- [`pourEventStoreEvents`](#poureventstoreevents): Pour all the events of an event store in a provided `NotificationMessageChannel`.

### `pourEventStoreAggregateIds`

Pour all the aggregate ids of an event store in a provided [`AggregateExistsMessageChannel`](https://github.com/castore-dev/castore#--event-driven-architecture). Aggregate ids are published in the order in which they are retrieved (by default, ordered by their initial timestamps).

```ts
import { pourEventStoreAggregateIds } from '@castore/dam';

// 👇 ...or AggregateExistsMessageBus
const maintenanceMessageQueue = new AggregateExistsMessageQueue({
  ...
});

await pourEventStoreAggregateIds({
  eventStore: pokemonsEventStore,
  messageChannel: maintenanceMessageQueue,
  // 👇 Optional `listAggregateIds` options (except "pageToken")
  options: {
    limit: 100,
    initialEventAfter: '2020-01-01T00:00:00.000Z',
    initialEventBefore: '2023-01-01T00:00:00.000Z',
    reverse: false,
  },
  // 👇 Optional rate limit (messages/second)
  rateLimit: 100,
});
```

### `pourAggregateEvents`

Pour all the events of a specific aggregate in a provided [`NotificationMessageChannel`](https://github.com/castore-dev/castore#--event-driven-architecture). Events are published in the order in which they are retrieved (by default, ordered by their timestamps).

```ts
import { pourAggregateEvents } from '@castore/dam';

// 👇 ...or NotificationMessageBus
const maintenanceMessageQueue = new NotificationMessageQueue({
  ...
});

await pourAggregateEvents({
  eventStore: pokemonsEventStore,
  messageChannel: maintenanceMessageQueue,
  aggregateId: 'pikachu1',
  // 👇 Optional `getEvents` options
  options: {
    minVersion: 1,
    maxVersion: 10,
    limit: 5,
    reverse: false,
  },
  // 👇 Optional `timestamp` filters
  filters: {
    from: '2020-01-01T00:00:00.000Z',
    to: '2023-01-01T00:00:00.000Z',
  },
  // 👇 Optional rate limit (messages/second)
  rateLimit: 100,
});
```

### `pourEventStoreEvents`

Pour all the events of an event store in a provided [`NotificationMessageChannel`](https://github.com/castore-dev/castore#--event-driven-architecture). Events are published in the order of their timestamps (accross aggregates).

```ts
import { pourEventStoreEvents } from '@castore/dam';

// 👇 ...or NotificationMessageBus
const maintenanceMessageQueue = new NotificationMessageQueue({
  ...
});

await pourEventStoreEvents({
  eventStore: pokemonsEventStore,
  messageChannel: maintenanceMessageQueue,
  // 👇 Optional `timestamp` filters
  filters: {
    from: '2020-01-01T00:00:00.000Z',
    to: '2023-01-01T00:00:00.000Z',
  },
  // 👇 Optional rate limit (messages/second)
  rateLimit: 100,
});
```
