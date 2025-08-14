import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import type { AggregateMeta } from '../../aggregate/AggregateMeta.ts'
import type { PersistedAggregate } from './PersistedAggregate.ts'

export const unmarshallAggregate = (
	item: Record<string, AttributeValue>,
): PersistedAggregate => {
	const persisted = unmarshall(item)

	const { aggregateId, version, actorId, updatedAt, ...attributes } = persisted

	const $meta: AggregateMeta = {
		id: aggregateId,
		version,
		actorId,
	}
	if (updatedAt !== undefined) $meta.updatedAt = new Date(updatedAt)

	return {
		$meta,
		...attributes,
	} as PersistedAggregate
}
