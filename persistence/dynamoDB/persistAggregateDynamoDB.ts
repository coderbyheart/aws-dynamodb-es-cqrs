import type { PersistAggregateFn } from '#persistence/PersistAggregateFn.ts'
import {
	UpdateItemCommand,
	type DynamoDBClient,
} from '@aws-sdk/client-dynamodb'
import type { PersistedAggregate } from './PersistedAggregate.ts'
import { toUpdate } from './toUpdate.ts'

/**
 * Generic function to persist an aggregate to DynamoDB.
 *
 * This is useful if only the aggregate is modified using an existing event.
 */
export const persistAggregateDynamoDB =
	(
		db: DynamoDBClient,
		aggregateTableName: string,
	): PersistAggregateFn<PersistedAggregate> =>
	async (aggregate) => {
		await db.send(
			new UpdateItemCommand(toUpdate(aggregate, aggregateTableName)),
		)
		return true
	}
