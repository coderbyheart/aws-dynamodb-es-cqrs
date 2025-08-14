import type { AggregateMeta } from '../aggregate/AggregateMeta.ts'
import type { AggregateEvent } from './AggregateEvent.ts'

export const assertAggregateEvent: (
	aggregate: { $meta: AggregateMeta } | undefined,
	event: AggregateEvent,
) => asserts aggregate = (aggregate, event) => {
	if (aggregate === undefined)
		throw new TypeError(`Event ${event.eventName} requires an aggregate`)
	if (aggregate.$meta.id !== event.aggregateId)
		throw new TypeError(`${event.eventName} event targets different aggregate`)
}
