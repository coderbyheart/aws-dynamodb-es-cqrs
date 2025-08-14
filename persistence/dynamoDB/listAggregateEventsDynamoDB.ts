import type { AggregateEvent } from '#event/AggregateEvent.ts'
import { type DynamoDBClient, paginateQuery } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import type { ListAggregateEventsFn } from '../ListAggregateEventsFn.ts'

export const listAggregateEventsDynamoDB =
	(db: DynamoDBClient, TableName: string): ListAggregateEventsFn =>
	async (aggregateId) => {
		const list: Array<AggregateEvent> = []

		for await (const page of paginateQuery(
			{
				client: db,
			},
			{
				TableName,
				KeyConditionExpression: '#aggregateId = :aggregateId',
				ExpressionAttributeNames: {
					'#aggregateId': 'aggregateId',
				},
				ExpressionAttributeValues: {
					':aggregateId': {
						S: aggregateId,
					},
				},
			},
		)) {
			for (const item of page.Items ?? []) {
				const { eventTs, ...rest } = unmarshall(item)
				void eventTs
				list.push(rest as AggregateEvent)
			}
		}
		return list
	}
