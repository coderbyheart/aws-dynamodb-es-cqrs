import { type DynamoDBClient } from '@aws-sdk/client-dynamodb'
import type { PersistFn } from '../../../persistence/PersistFn.ts'
import { persistDynamoDB } from '../../../persistence/dynamoDB/persistDynamoDB.ts'
import type { BlogPostAggregate } from '../../aggregate/BlogPostAggregate.ts'

export const persistBlogPostDynamoDB = (
	db: DynamoDBClient,
	blogPostAggregatesTableName: string,
	eventsTableName: string,
): PersistFn<BlogPostAggregate> =>
	persistDynamoDB(db, blogPostAggregatesTableName, eventsTableName)
