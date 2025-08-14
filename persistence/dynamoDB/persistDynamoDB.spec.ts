import type { AggregateEvent, ULID } from '#event/AggregateEvent.ts'
import type { TransactWriteItemsCommandInput } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { randomUUID } from 'crypto'
import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { decodeTime, ulid } from 'ulidx'
import { fromEvent } from '../../aggregate/AggregateMeta.ts'
import { v, v1 } from '../../aggregate/AggregateVersion.ts'
import { persistDynamoDB } from './persistDynamoDB.ts'

void describe('persistDynamoDB()', () => {
	void it('should persist a new aggregate', async () => {
		const sendMock =
			mock.fn<
				(args: { input: TransactWriteItemsCommandInput }) => Promise<any>
			>()

		const persist = persistDynamoDB(
			{
				send: sendMock,
			} as any,
			'test-aggregates-table',
			'test-events-table',
		)

		const id = ulid() as ULID
		const actor = `some-actor:${randomUUID()}`
		const event: AggregateEvent = {
			eventId: ulid() as ULID,
			eventName: 'SomeEvent',
			aggregateName: 'SomeAggregate',
			aggregateId: id,
			aggregateVersion: v1,
			actorId: actor,
		}

		await persist(
			{
				$meta: fromEvent(event),
			},
			event,
		)

		assert.deepEqual(sendMock.mock.calls[0]!.arguments[0].input.TransactItems, [
			{
				Update: {
					TableName: 'test-aggregates-table',
					Key: { aggregateId: { S: id } },
					ExpressionAttributeValues: {
						':version': { N: '1' },
						':actorId': { S: actor },
					},
					ExpressionAttributeNames: {
						'#aggregateId': 'aggregateId',
						'#version': 'version',
						'#actorId': 'actorId',
					},
					ConditionExpression: 'attribute_not_exists(#aggregateId)',
					UpdateExpression: 'SET #version = :version, #actorId = :actorId',
				},
			},
			{
				Put: {
					TableName: 'test-events-table',
					Item: marshall({
						...event,
						eventTs: new Date(decodeTime(event.eventId)).toISOString(),
					}),
				},
			},
		])
	})

	void it('should persist a new aggregate with additional properties', async () => {
		const sendMock =
			mock.fn<
				(args: { input: TransactWriteItemsCommandInput }) => Promise<any>
			>()

		const persist = persistDynamoDB(
			{
				send: sendMock,
			} as any,
			'test-aggregates-table',
			'test-events-table',
		)

		const id = ulid() as ULID
		const actor = `some-actor:${randomUUID()}`
		const event: AggregateEvent = {
			eventId: ulid() as ULID,
			eventName: 'SomeEvent',
			aggregateName: 'SomeAggregate',
			aggregateId: id,
			aggregateVersion: v1,
			actorId: actor,
		}
		await persist(
			{
				$meta: fromEvent(event),
				some: 'payload',
			},
			event,
		)

		assert.deepEqual(sendMock.mock.calls[0]!.arguments[0].input.TransactItems, [
			{
				Update: {
					TableName: 'test-aggregates-table',
					Key: { aggregateId: { S: id } },
					ExpressionAttributeValues: {
						':version': { N: '1' },
						':actorId': { S: actor },
						':some': {
							S: 'payload',
						},
					},
					ExpressionAttributeNames: {
						'#aggregateId': 'aggregateId',
						'#version': 'version',
						'#actorId': 'actorId',
						'#some': 'some',
					},
					ConditionExpression: 'attribute_not_exists(#aggregateId)',
					UpdateExpression:
						'SET #version = :version, #actorId = :actorId, #some = :some',
				},
			},
			{
				Put: {
					TableName: 'test-events-table',
					Item: marshall({
						...event,
						eventTs: new Date(decodeTime(event.eventId)).toISOString(),
					}),
				},
			},
		])
	})

	void it('should persist an updated aggregate', async () => {
		const sendMock =
			mock.fn<
				(args: { input: TransactWriteItemsCommandInput }) => Promise<any>
			>()

		const persist = persistDynamoDB(
			{
				send: sendMock,
			} as any,
			'test-aggregates-table',
			'test-events-table',
		)

		const id = ulid() as ULID
		const updatedAt = new Date()
		const actor = `some-actor:${randomUUID()}`
		const event: AggregateEvent = {
			eventId: ulid() as ULID,
			eventName: 'SomeEvent',
			aggregateName: 'SomeAggregate',
			aggregateId: id,
			aggregateVersion: v(2),
			actorId: `some-actor:${randomUUID()}`,
		}

		await persist(
			{
				$meta: {
					id,
					version: v(2),
					actorId: actor,
					updatedAt,
				},
			},
			event,
		)

		const {
			TableName,
			Key,
			ExpressionAttributeValues,
			ExpressionAttributeNames,
			ConditionExpression,
			UpdateExpression,
		} = sendMock.mock.calls[0]!.arguments[0].input.TransactItems![0]!.Update!
		assert.deepEqual(TableName, 'test-aggregates-table')
		assert.deepEqual(Key, { aggregateId: { S: id } })
		assert.deepEqual(ExpressionAttributeValues, {
			':version': { N: '2' },
			':actorId': { S: actor },
			':prevVersion': {
				N: '1',
			},
			':updatedAt': {
				S: updatedAt.toISOString(),
			},
		})
		assert.deepEqual(ExpressionAttributeNames, {
			'#aggregateId': 'aggregateId',
			'#version': 'version',
			'#actorId': 'actorId',
			'#updatedAt': 'updatedAt',
		})
		assert.deepEqual(
			ConditionExpression,
			'attribute_exists(#aggregateId) AND #version = :prevVersion',
		)
		assert.deepEqual(
			UpdateExpression,
			'SET #version = :version, #actorId = :actorId, #updatedAt = :updatedAt',
		)
	})

	void it('should return an ReservedFieldError if the aggregate contains a reserved field', async () => {
		const sendMock =
			mock.fn<
				(args: { input: TransactWriteItemsCommandInput }) => Promise<any>
			>()

		const persist = persistDynamoDB(
			{
				send: sendMock,
			} as any,
			'test-aggregates-table',
			'test-events-table',
		)

		const id = ulid() as ULID
		const updatedAt = new Date()
		const actor = `some-actor:${randomUUID()}`

		await assert.rejects(
			async () =>
				persist(
					{
						$meta: {
							id,
							version: v(2),
							actorId: actor,
							updatedAt,
						},
						version: 1,
					},
					{
						eventId: ulid() as ULID,
						eventName: 'SomeEvent',
						aggregateName: 'SomeAggregate',
						aggregateId: id,
						aggregateVersion: v1,
						actorId: `some-actor:${randomUUID()}`,
					},
				),
			(error) => {
				assert.match((error as Error).message, /version/)
				return true
			},
		)
	})
})
