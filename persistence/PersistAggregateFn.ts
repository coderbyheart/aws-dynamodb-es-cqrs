import type { AggregateMeta } from '../aggregate/AggregateMeta.ts'

export type PersistAggregateFn<
	A extends Record<string, unknown> & { $meta: AggregateMeta },
> = (aggregate: A) => Promise<true>
