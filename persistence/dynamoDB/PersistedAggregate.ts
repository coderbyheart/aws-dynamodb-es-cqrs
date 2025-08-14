import type { AggregateMeta } from '../../aggregate/AggregateMeta.ts'

export type PersistedAggregate = Record<string, unknown> & {
	$meta: AggregateMeta
}
