import { type DynamoDBClient, paginateScan } from '@aws-sdk/client-dynamodb'
import { unmarshallAggregate } from '../../../persistence/dynamoDB/unmarshallAggregate.ts'
import type { BlogPostAggregate } from '../../aggregate/BlogPostAggregate.ts'
import type { ListBlogPostsFn } from '../ListBlogPostsFn.ts'

export const listBlogPostsDynamoDB =
	(db: DynamoDBClient, TableName: string): ListBlogPostsFn =>
	async () => {
		const list: Array<BlogPostAggregate> = []

		for await (const page of paginateScan(
			{
				client: db,
			},
			{
				TableName,
			},
		)) {
			for (const item of page.Items ?? []) {
				list.push(unmarshallAggregate(item) as BlogPostAggregate)
			}
		}
		return list
	}
