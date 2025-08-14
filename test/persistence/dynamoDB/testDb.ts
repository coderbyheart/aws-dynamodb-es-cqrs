import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { ulid } from 'ulidx'

export const testDb = (): { TablePrefix: string; db: DynamoDBClient } => ({
	TablePrefix: `aws-dynamodb-es-cqrs-${ulid()}`,
	db: new DynamoDBClient({
		endpoint: 'http://localhost:8000/',
		region: 'eu-north-1',
	}),
})
