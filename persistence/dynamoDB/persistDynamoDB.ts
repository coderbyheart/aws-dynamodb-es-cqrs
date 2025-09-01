import {
	TransactionCanceledException,
	TransactWriteItemsCommand,
	type DynamoDBClient,
} from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { decodeTime } from 'ulidx'
import type { PersistFn } from '../PersistFn.ts'
import type { PersistedAggregate } from './PersistedAggregate.ts'
import { toUpdate } from './toUpdate.ts'

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
	async (aggregate, event) => {
		try {
			await db.send(
				new TransactWriteItemsCommand({
					TransactItems: [
						{
							Update: toUpdate(aggregate, aggregateTableName),
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
					throw new Error(
						`Failed to persist "${aggregate.$meta.id}" due to version conflict!`,
					)
				}
				if (err.CancellationReasons?.[0]?.Code === 'DuplicateItem') {
					throw new Error(
						`Failed to persist "${aggregate.$meta.id}" due to duplicate item!`,
					)
				}
			}
			throw err
		}
		return true
	}
