import {
	TransactionCanceledException,
	TransactWriteItemsCommand,
	type DynamoDBClient,
	type UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { decodeTime } from 'ulidx'
import type { PersistFn } from '../PersistFn.ts'
import type { PersistedAggregate } from './PersistedAggregate.ts'

export const reservedFields = new Set<string>([
	'version',
	'actorId',
	'aggregateId',
	'updatedAt',
])

/**
 * Generic function to persist an aggregate and the change event to DynamoDB.
 *
 * This is done in a single transaction to ensure that the aggregate and the
 * event store are always in sync.
 */
export const persistDynamoDB =
	(
		db: DynamoDBClient,
		aggregateTableName: string,
		eventsTableName: string,
	): PersistFn<PersistedAggregate> =>
	async (
		{ $meta: { id, version, actorId, updatedAt }, ...attributes },
		event,
	) => {
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

		try {
			await db.send(
				new TransactWriteItemsCommand({
					TransactItems: [
						{
							Update: {
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
									...(version !== 1
										? marshall({ ':prevVersion': version - 1 })
										: {}),
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
							},
						},
						// Persist the event
						{
							Put: {
								TableName: eventsTableName,
								Item: marshall(
									{
										...event,
										// Added for convenience
										eventTs: new Date(decodeTime(event.eventId)).toISOString(),
									},
									{
										removeUndefinedValues: true,
									},
								),
							},
						},
					],
				}),
			)
		} catch (err) {
			if (err instanceof TransactionCanceledException) {
				if (err.CancellationReasons?.[0]?.Code === 'ConditionalCheckFailed') {
					throw new Error(`Failed to persist "${id}" due to version conflict!`)
				}
				if (err.CancellationReasons?.[0]?.Code === 'DuplicateItem') {
					throw new Error(`Failed to persist "${id}" due to duplicate item!`)
				}
			}
			throw err
		}
		return true
	}
