import type { AggregateEvent } from '#event/AggregateEvent.ts'
import type { AggregateMeta } from '../AggregateMeta.ts'

export type ApplyEventsFn<
	A extends Record<string, any> & { $meta: AggregateMeta },
> = (events: Array<AggregateEvent>, aggregate?: A) => A

export type ApplyEventFn<
	A extends Record<string, any> & { $meta: AggregateMeta },
> = (event: AggregateEvent, aggregate?: A) => A | undefined
