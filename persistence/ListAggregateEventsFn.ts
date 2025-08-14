import type { AggregateEvent, ULID } from '#event/AggregateEvent.ts'

export type ListAggregateEventsFn = (
	aggregateId: ULID,
) => Promise<Array<AggregateEvent>>
