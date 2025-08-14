# aws-dynamodb-es-cqrs · ES/CQRS using AWS DynamoDB

[![GitHub Actions](https://github.com/coderbyheart/aws-dynamodb-es-cqrs/actions/workflows/test-and-release.yaml/badge.svg)](https://github.com/coderbyheart/aws-dynamodb-es-cqrs/actions/workflows/test-and-release.yaml)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![@commitlint/config-conventional](https://img.shields.io/badge/%40commitlint-config--conventional-brightgreen)](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier/)
[![ESLint: TypeScript](https://img.shields.io/badge/ESLint-TypeScript-blue.svg)](https://github.com/typescript-eslint/typescript-eslint)

- Events
  - Events are described by [`AggregateEvent`](./event/AggregateEvent.ts)
    (ULID-based `eventId`, `aggregateName`, `aggregateId`, `aggregateVersion`,
    `actorId`).
  - Aggregate metadata:
    - [`AggregateMeta`](./aggregate/AggregateMeta.ts) with `id`, `version`,
      `actorId`, optional `updatedAt`.

- Reducing events to aggregates (Event Sourcing)
  - Generic reducer: [`reduceEvents`](./aggregate/reducer/reduceEvents.ts)
    applies a sequence of [`AggregateEvent`](./event/AggregateEvent.ts) to
    produce an aggregate state.
  - Domain reducer example (BlogPost):
    [`blogPostReducer`](./test/aggregate/blogPostReducer.ts) uses type guards
    (`isNamedEvent`) and assertions (`assertAggregateEvent`) to evolve state
    from events.

- Commands (write side)
  - Commands validate current state and produce new events:
    - Create: [`createBlogPostCommand`](./test/command/createBlogPostCommand.ts)
    - Publish:
      [`publishBlogPostCommand`](./test/command/publishBlogPostCommand.ts)
    - Update title:
      [`updateBlogPostTitleCommand`](./test/command/updateBlogPostTitleCommand.ts)
  - Concurrency and existence are enforced using:
    - [`ConflictError`](./error/ConflictError.ts) and
      [`NotFoundError`](./error/NotFoundError.ts)
    - Version checks against the loaded aggregate before emitting the next
      event.

- Persistence (event store + aggregate projection)
  - DynamoDB persistence is transactional to keep aggregate and event store in
    sync:
    - [`persistDynamoDB`](./persistence/dynamoDB/persistDynamoDB.ts) performs a
      TransactWrite that:
      - Upserts the aggregate row with optimistic concurrency:
        - New aggregate: `attribute_not_exists(aggregateId)` (version 1).
        - Update: `#version = :prevVersion` and sets `updatedAt`.
      - Writes the event into the events table.
    - Aggregate unmarshalling for reads:
      [`unmarshallAggregate`](./persistence/dynamoDB/unmarshallAggregate.ts).
  - Event queries:
    - List an aggregate’s events:
      [`listAggregateEventsDynamoDB`](./persistence/dynamoDB/listAggregateEventsDynamoDB.ts)
    - Parse DynamoDB Streams records back into events:
      [`extractEventsFromDynamoDBEvent`](./persistence/dynamoDB/extractEventsFromDynamoDBEvent.ts)

- Queries (read side)
  - Read the current aggregate projection:
    - Example (BlogPost):
      - [`findBlogPostByIdDynamoDB`](./test/persistence/dynamoDB/findBlogPostByIdDynamoDB.ts).
      - [`listBlogPostsDynamoDB`](./test/persistence/dynamoDB/listBlogPostsDynamoDB.ts).

## Setup

Install the dependencies:

```bash
npm ci
```

## Tests

The [`test`](./test) folder contains an example aggregate (a blog post), and
operations that manipulate it, which demonstrate how the key components of this
implementation work with separate read/write components demonstrating create,
read aggregate, list events, and optimistic concurrency.

Install DynamoDB (local)

```bash
wget https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt/dynamodb_local_latest.zip
unzip dynamodb_local_latest.zip -d ./dynamodb_local_latest
```

Start it in background:

```bash
java -Djava.library.path=./dynamodb_local_latest/DynamoDBLocal_lib -jar ./dynamodb_local_latest/DynamoDBLocal.jar -sharedDb -inMemory &
```

Run the tests:

```bash
npm test
```
