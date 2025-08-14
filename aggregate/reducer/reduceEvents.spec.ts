import type { AggregateEvent, ULID } from '#event/AggregateEvent.ts'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ulid } from 'ulidx'
import { testActor } from '../../test/testActor.ts'
import type { AggregateMeta } from '../AggregateMeta.ts'
import { v, v1 } from '../AggregateVersion.ts'
import { reduceEvents } from './reduceEvents.ts'

const createEvent = (
	overrides: Partial<AggregateEvent> = {},
): AggregateEvent => ({
	// minimal valid event fields
	eventId: ulid() as ULID,
	eventName: overrides.eventName ?? 'TestEvent',
	aggregateName: overrides.aggregateName ?? 'TestAggregate',
	aggregateId: overrides.aggregateId ?? (ulid() as ULID),
	aggregateVersion: overrides.aggregateVersion ?? v1,
	actorId: overrides.actorId ?? testActor(),
})

type TestAggregate = { $meta: AggregateMeta; value: number }

void describe('reduceEvents()', () => {
	void it('should build an aggregate from events', () => {
		const aggregateId = ulid() as ULID
		const events: AggregateEvent[] = [
			createEvent({ aggregateId, aggregateVersion: v1 }),
			createEvent({ aggregateId, aggregateVersion: v(2) }),
			createEvent({ aggregateId, aggregateVersion: v(3) }),
		]
		const processed: string[] = []

		const apply = (
			event: AggregateEvent,
			aggregate?: TestAggregate,
		): TestAggregate | undefined => {
			processed.push(event.eventName)
			if (!aggregate) {
				return {
					$meta: {
						id: event.aggregateId,
						version: event.aggregateVersion,
						actorId: event.actorId,
					},
					value: 1,
				}
			}
			return {
				...aggregate,
				$meta: {
					...aggregate.$meta,
					version: event.aggregateVersion,
					actorId: event.actorId,
				},
				value: aggregate.value + 1,
			}
		}

		const reducer = reduceEvents<TestAggregate>(apply)
		const agg = reducer(events)
		assert.equal(agg.value, 3)
		assert.equal(agg.$meta.version, events[2]!.aggregateVersion)
		assert.deepStrictEqual(
			processed,
			events.map((e) => e.eventName),
		)
	})

	void it('should continue reducing from an existing aggregate', () => {
		const aggregateId = ulid() as ULID
		const firstEvent = createEvent({
			aggregateId,
			aggregateVersion: v1,
		})
		const secondEvent = createEvent({
			aggregateId,
			aggregateVersion: v(2),
		})

		const apply = (
			event: AggregateEvent,
			aggregate?: TestAggregate,
		): TestAggregate | undefined => {
			if (!aggregate)
				return {
					$meta: {
						id: event.aggregateId,
						version: event.aggregateVersion,
						actorId: event.actorId,
					},
					value: 1,
				}
			return {
				...aggregate,
				$meta: {
					...aggregate.$meta,
					version: event.aggregateVersion,
					actorId: event.actorId,
				},
				value: aggregate.value + 1,
			}
		}
		const reducer = reduceEvents<TestAggregate>(apply)
		const agg1 = reducer([firstEvent])
		const agg2 = reducer([secondEvent], agg1)
		assert.equal(agg2.value, 2)
		assert.equal(agg2.$meta.version, secondEvent.aggregateVersion)
	})

	void it('should throw when events array is empty', () => {
		const reducer = reduceEvents<any>(() => undefined)
		assert.throws(() => reducer([]), /No events to reduce!/)
	})

	void it('should throw when applyEvent returns undefined for all events', () => {
		const events = [createEvent()]
		const reducer = reduceEvents<any>(() => undefined)
		assert.throws(() => reducer(events), /Failed to reduce events/)
	})

	void it('should throw when applyEvent returns undefined for last event (losing state)', () => {
		const aggregateId = ulid() as ULID
		const events: AggregateEvent[] = [
			createEvent({ aggregateId, aggregateVersion: v1 }),
			createEvent({ aggregateId, aggregateVersion: v(2) }),
		]
		// First event builds state, second returns undefined -> final state becomes undefined
		const apply = (
			event: AggregateEvent,
			aggregate?: TestAggregate,
		): TestAggregate | undefined => {
			if (!aggregate)
				return {
					$meta: {
						id: event.aggregateId,
						version: event.aggregateVersion,
						actorId: event.actorId,
					},
					value: 1,
				}
			return undefined
		}
		const reducer = reduceEvents<TestAggregate>(apply)
		assert.throws(() => reducer(events), /Failed to reduce events/)
	})
})
