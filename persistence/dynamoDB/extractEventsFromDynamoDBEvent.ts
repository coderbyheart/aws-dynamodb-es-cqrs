import type { AggregateEvent } from '#event/AggregateEvent.ts'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import type { DynamoDBStreamEvent } from 'aws-lambda'

/**
 * Parses a DynamoDB stream event and extracts the events from it.
 */
export const extractEventsFromDynamoDBEvent = (
	event: DynamoDBStreamEvent,
): Array<AggregateEvent> => {
	const { Records } = event
	const events: Array<AggregateEvent> = []
	for (const { dynamodb } of Records) {
		if (dynamodb?.NewImage === undefined) continue
		events.push(
			unmarshall(
				dynamodb.NewImage as { [key: string]: AttributeValue },
			) as AggregateEvent,
		)
	}
	return events
}
