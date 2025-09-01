import type { AggregateMeta } from '#aggregate/AggregateMeta.ts'
import { type UpdateItemCommandInput } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'

export const reservedFields = new Set<string>([
	'version',
	'actorId',
	'aggregateId',
	'updatedAt',
])

export const toUpdate = (
	{
		$meta: { id, version, actorId, updatedAt },
		...attributes
	}: Record<string, unknown> & { $meta: AggregateMeta },
	aggregateTableName: string,
): UpdateItemCommandInput & { UpdateExpression: string } => {
	// Check if the attributes contain any reserved fields
	for (const field of Object.keys(attributes)) {
		if (reservedFields.has(field)) {
			throw new TypeError(`Field "${field}" is reserved and cannot be used.`)
		}
	}

	const updates = new Map<string, any>([
		['version', version],
		['actorId', actorId],
		...Object.entries(attributes).filter(([, v]) => v !== undefined),
	])

	const updateArgs: UpdateItemCommandInput = {
		TableName: aggregateTableName,
		Key: marshall({ aggregateId: id }),
		ExpressionAttributeValues: {},
		ExpressionAttributeNames: {},
	}

	if (version === 1) {
		updateArgs.ConditionExpression = 'attribute_not_exists(#aggregateId)'
	} else {
		updateArgs.ConditionExpression =
			'attribute_exists(#aggregateId) AND #version = :prevVersion'
		updates.set('updatedAt', updatedAt!.toISOString())
	}

	return {
		...updateArgs,
		ExpressionAttributeValues: {
			...Object.fromEntries(
				Array.from(updates.entries()).map(([k, v]) => [
					`:${k}`,
					marshall(v, {
						convertTopLevelContainer: true,
					}),
				]),
			),
			...(version !== 1 ? marshall({ ':prevVersion': version - 1 }) : {}),
		},
		ExpressionAttributeNames: {
			'#aggregateId': 'aggregateId',
			...Object.fromEntries(
				Array.from(updates.entries()).map(([k]) => [`#${k}`, k]),
			),
			...(version !== 1 ? { '#version': 'version' } : {}),
		},
		UpdateExpression: `SET ${Array.from(updates.keys())
			.map((f) => `#${f} = :${f}`)
			.join(', ')}`,
	}
}
