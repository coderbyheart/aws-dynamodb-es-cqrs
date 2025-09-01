import type { AggregateEvent, ULID } from '#event/AggregateEvent.ts'
import { randomUUID } from 'crypto'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ulid } from 'ulidx'
import { fromEvent } from '../../aggregate/AggregateMeta.ts'
import { v, v1 } from '../../aggregate/AggregateVersion.ts'
import { toUpdate } from './toUpdate.ts'

void describe('toUpdate()', () => {
	void it('should handle a new aggregate', async () => {
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

		assert.deepEqual(
			toUpdate(
				{
					$meta: fromEvent(event),
				},
				'test-aggregates-table',
			),
			{
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
		)
	})

	void it('should handle a new aggregate with additional properties', async () => {
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

		assert.deepEqual(
			toUpdate(
				{
					$meta: fromEvent(event),
					some: 'payload',
				},
				'test-aggregates-table',
			),
			{
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
		)
	})

	void it('should handle an updated aggregate', async () => {
		const id = ulid() as ULID
		const updatedAt = new Date()
		const actor = `some-actor:${randomUUID()}`
		const {
			TableName,
			Key,
			ExpressionAttributeValues,
			ExpressionAttributeNames,
			ConditionExpression,
			UpdateExpression,
		} = toUpdate(
			{
				$meta: {
					id,
					version: v(2),
					actorId: actor,
					updatedAt,
				},
			},
			'test-aggregates-table',
		)
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
		const id = ulid() as ULID
		const updatedAt = new Date()
		const actor = `some-actor:${randomUUID()}`

		await assert.rejects(
			async () =>
				toUpdate(
					{
						$meta: {
							id,
							version: v(2),
							actorId: actor,
							updatedAt,
						},
						version: 1,
					},
					'test-aggregates-table',
				),
			(error) => {
				assert.match((error as Error).message, /version/)
				return true
			},
		)
	})
})
