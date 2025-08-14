import type { AggregateEvent } from '#event/AggregateEvent.ts'
import type { AggregateMeta } from '../aggregate/AggregateMeta.ts'

export type PersistFn<
	A extends Record<string, unknown> & { $meta: AggregateMeta },
> = (aggregate: A, event: AggregateEvent) => Promise<true>
