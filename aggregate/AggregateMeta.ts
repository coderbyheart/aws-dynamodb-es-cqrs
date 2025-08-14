import type { AggregateEvent, ULID } from '#event/AggregateEvent.ts'
import { decodeTime } from 'ulidx'
import type { AggregateVersion } from './AggregateVersion.ts'
import { inc, v1 } from './AggregateVersion.ts'

export type AggregateMeta = {
	id: ULID
	version: AggregateVersion
	actorId: string
	updatedAt?: Date
}

export const fromEvent = (event: AggregateEvent): AggregateMeta => ({
	id: event.aggregateId,
	version: v1,
	actorId: event.actorId,
})

export const updateFromEvent = (
	meta: AggregateMeta,
	event: AggregateEvent,
): AggregateMeta => ({
	...meta,
	updatedAt: new Date(decodeTime(event.eventId)),
	version: inc(meta.version),
	actorId: event.actorId,
})
