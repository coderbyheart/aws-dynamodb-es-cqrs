import type { AggregateEvent } from './AggregateEvent.ts'

export const isAggregateEvent = (event: unknown): event is AggregateEvent => {
	if (typeof event !== 'object' || event === null) {
		return false
	}
	const e = event as AggregateEvent
	return (
		typeof e.eventId === 'string' &&
		typeof e.eventName === 'string' &&
		typeof e.aggregateName === 'string' &&
		typeof e.aggregateId === 'string' &&
		typeof e.aggregateVersion === 'number' &&
		typeof e.actorId === 'string'
	)
}
