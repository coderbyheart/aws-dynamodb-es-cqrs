import type { AggregateEvent } from '#event/AggregateEvent.ts'
import type { AggregateMeta } from '../AggregateMeta.ts'
import type { ApplyEventFn, ApplyEventsFn } from './ApplyEventsFn.ts'

export const reduceEvents =
	<A extends Record<string, any> & { $meta: AggregateMeta }>(
		applyEvent: ApplyEventFn<A>,
	): ApplyEventsFn<A> =>
	(events: Array<AggregateEvent>, aggregate?: A) => {
		let updatedAggregate = aggregate
		let n = 0
		let event: AggregateEvent | undefined = events[n]
		do {
			if (event === undefined) throw new Error('No events to reduce!')
			updatedAggregate = applyEvent(event, updatedAggregate)
			event = events[++n]
		} while (event !== undefined)

		if (updatedAggregate === undefined)
			throw new Error(`Failed to reduce events: ${JSON.stringify(events)}`)
		return updatedAggregate
	}
