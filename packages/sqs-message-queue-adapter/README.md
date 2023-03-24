# SQS Message Queue Adapter

DRY Castore [`MessageQueue`](https://github.com/castore-dev/castore/#--messagequeue) definition using [AWS SQS](https://aws.amazon.com/sqs/).

## 📥 Installation

```bash
# npm
npm install @castore/sqs-message-queue-adapter

# yarn
yarn add @castore/sqs-message-queue-adapter
```

This package has `@castore/core` and `@aws-sdk/client-sqs` (above v3) as peer dependencies, so you will have to install them as well:

```bash
# npm
npm install @castore/core @aws-sdk/client-sqs

# yarn
yarn add @castore/core @aws-sdk/client-sqs
```

## 👩‍💻 Usage

```ts
import { SQSClient } from '@aws-sdk/client-sqs';

import { SQSMessageQueueAdapter } from '@castore/sqs-message-queue-adapter';

const sqsClient = new SQSClient({});

const messageQueueAdapter = new SQSMessageQueueAdapter({
  queueUrl: 'https://sqs.us-east-1.amazonaws.com/111122223333/my-super-queue',
  sqsClient,
});

// 👇 Alternatively, provide a getter
const messageQueueAdapter = new SQSMessageQueueAdapter({
  queueUrl: () => process.env.MY_SQS_QUEUE_URL,
  sqsClient,
});

const appMessageQueue = new NotificationMessageQueue({
  ...
  messageQueueAdapter
})
```

This will directly plug your MessageQueue to SQS 🙌

## 🤔 How it works

When publishing a message, it is JSON stringified and passed as the record body.

```ts
// 👇 Record example
{
  "body": "{
    \"eventStoreId\": \"POKEMONS\",
    \"event\": {
      \"aggregateId\": \"123\",
      \"version\": 1,
      \"type\": \"POKEMON_APPEARED\",
      \"timestamp\": ...
      ...
    },
    \"aggregate\": ... // <= for state-carrying message queues
  }",
  ... // <= Other technical SQS properties
}
```

On the worker side, you can use the `SQSMessageQueueMessage` and `SQSMessageQueueMessageBody` TS types to type your argument:

```ts
import type {
  SQSMessageQueueMessage,
  SQSMessageQueueMessageBody,
} from '@castore/sqs-message-queue-adapter';

const appMessagesWorker = async ({ Records }: SQSMessageQueueMessage) => {
  Records.forEach(({ body }) => {
    // 👇 Correctly typed!
    const recordBody: SQSMessageQueueMessageBody<typeof appMessageQueue> =
      JSON.parse(body);
  });
};
```

## 🔑 IAM

The `publishMessage` method requires the `sqs:SendMessage` IAM permission on the provided SQS queue.
