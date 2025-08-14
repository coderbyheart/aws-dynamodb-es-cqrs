import type { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
	BillingMode,
	CreateTableCommand,
	KeyType,
	ProjectionType,
	ScalarAttributeType,
} from '@aws-sdk/client-dynamodb'
import { ulid } from 'ulidx'

export const createTestTables = async (
	db: DynamoDBClient,
): Promise<{
	eventsTableName: string
	blogPostsTableName: string
}> => {
	const prefix = `aws-dynamodb-es-cqrs-${ulid()}`
	const eventsTableName = `${prefix}-events`
	const blogPostsTableName = `${prefix}-blog-posts`
	// Create the events table
	await db.send(
		new CreateTableCommand({
			TableName: eventsTableName,
			KeySchema: [
				{
					AttributeName: 'aggregateId',
					KeyType: KeyType.HASH,
				},
				{
					AttributeName: 'eventId',
					KeyType: KeyType.RANGE,
				},
			],
			AttributeDefinitions: [
				{
					AttributeName: 'aggregateId',
					AttributeType: ScalarAttributeType.S,
				},
				{
					AttributeName: 'eventId',
					AttributeType: ScalarAttributeType.S,
				},
				{
					AttributeName: 'eventName',
					AttributeType: ScalarAttributeType.S,
				},
			],
			BillingMode: BillingMode.PAY_PER_REQUEST,
			GlobalSecondaryIndexes: [
				{
					IndexName: 'eventNameIndex',
					KeySchema: [
						{
							AttributeName: 'eventName',
							KeyType: KeyType.HASH,
						},
						{
							AttributeName: 'aggregateId',
							KeyType: KeyType.RANGE,
						},
					],
					Projection: {
						ProjectionType: ProjectionType.KEYS_ONLY,
					},
				},
			],
		}),
	)
	// Create the blog post aggregate table
	await db.send(
		new CreateTableCommand({
			TableName: blogPostsTableName,
			KeySchema: [
				{
					AttributeName: 'aggregateId',
					KeyType: KeyType.HASH,
				},
			],
			AttributeDefinitions: [
				{
					AttributeName: 'aggregateId',
					AttributeType: ScalarAttributeType.S,
				},
			],
			BillingMode: BillingMode.PAY_PER_REQUEST,
		}),
	)

	return {
		eventsTableName,
		blogPostsTableName,
	}
}
