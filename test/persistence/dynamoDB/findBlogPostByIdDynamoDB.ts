import { type DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { unmarshallAggregate } from '../../../persistence/dynamoDB/unmarshallAggregate.ts'
import type { BlogPostAggregate } from '../../aggregate/BlogPostAggregate.ts'
import type { FindBlogPostByIdFn } from '../FindBlogPostByIdFn.ts'

export const findBlogPostByIdDynamoDB =
	(db: DynamoDBClient, TableName: string): FindBlogPostByIdFn =>
	async (id) => {
		const { Item } = await db.send(
			new GetItemCommand({
				TableName,
				Key: marshall({
					aggregateId: id,
				}),
			}),
		)

		if (Item === undefined) return null
		return unmarshallAggregate(Item) as BlogPostAggregate
	}
