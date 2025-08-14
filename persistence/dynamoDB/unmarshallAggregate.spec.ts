import { marshall } from '@aws-sdk/util-dynamodb'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ulid } from 'ulidx'
import { testActor } from '../../test/testActor.ts'
import { unmarshallAggregate } from './unmarshallAggregate.ts'

void describe('unmarshallAggregate()', () => {
	void it('should create $meta and keep other attributes', () => {
		const id = ulid()
		const actorId = testActor()

		const persisted = {
			aggregateId: id,
			version: 1,
			actorId,
			foo: 'bar',
			count: 42,
		}

		const result = unmarshallAggregate(marshall(persisted))

		assert.deepEqual(result, {
			$meta: {
				id,
				version: 1,
				actorId,
			},
			foo: 'bar',
			count: 42,
		})
	})

	void it('should include updatedAt in $meta when it is present', () => {
		const id = ulid()
		const updatedAt = '2024-01-02T03:04:05.678Z'
		const actorId = testActor()

		const persisted = {
			aggregateId: id,
			version: 3,
			actorId,
			updatedAt,
			authorId: testActor(),
			foo: 'bar',
			count: 42,
		}

		const result = unmarshallAggregate(marshall(persisted))

		assert.deepEqual(result, {
			$meta: {
				id,
				version: 3,
				actorId,
				updatedAt: new Date(updatedAt),
			},
			authorId: persisted.authorId,
			foo: 'bar',
			count: 42,
		})
	})
})
