import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { extractEventsFromDynamoDBEvent } from './extractEventsFromDynamoDBEvent.ts'

void describe('extractEventsFromDynamoDBEvent()', () => {
	void it('should extract events', () => {
		assert.deepEqual(
			extractEventsFromDynamoDBEvent({
				Records: [
					{
						eventID: '4613b0adf71aa7f4602fcccfcba70e4c',
						eventName: 'INSERT',
						eventVersion: '1.1',
						eventSource: 'aws:dynamodb',
						awsRegion: 'eu-north-1',
						dynamodb: {
							ApproximateCreationDateTime: 1754259181,
							Keys: {
								eventId: {
									S: '01K1RZXKEYCYQ5MSEQJ4Z5JNDE',
								},
								aggregateId: {
									S: '01K1RZXKEWDX1ESHFJVDHDWM2E',
								},
							},
							NewImage: {
								eventId: {
									S: '01K1RZXKEYCYQ5MSEQJ4Z5JNDE',
								},
								aggregateId: {
									S: '01K1RZXKEWDX1ESHFJVDHDWM2E',
								},
								actorId: {
									S: 'https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_I8tzxRuIa:805c098c-4061-7008-104e-3cd6d870a7ab',
								},
								aggregateName: {
									S: 'BlogPost',
								},
								title: {
									S: 'Some title',
								},
								eventName: {
									S: 'BlogPostCreated',
								},
								aggregateVersion: {
									N: '1',
								},
								eventTs: {
									S: '2025-08-03T22:13:01.022Z',
								},
							},
							SequenceNumber: '13999900001232806120223146',
							SizeBytes: 503,
							StreamViewType: 'NEW_IMAGE',
						},
						eventSourceARN:
							'arn:aws:dynamodb:eu-north-1:123456890109:table/aws-dynamodb-es-cqrs-persistence-eventsTable/stream/2025-07-31T22:21:46.510',
					},
				],
			}),
			[
				{
					actorId:
						'https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_I8tzxRuIa:805c098c-4061-7008-104e-3cd6d870a7ab',
					aggregateId: '01K1RZXKEWDX1ESHFJVDHDWM2E',
					aggregateName: 'BlogPost',
					aggregateVersion: 1,
					title: 'Some title',
					eventId: '01K1RZXKEYCYQ5MSEQJ4Z5JNDE',
					eventName: 'BlogPostCreated',
					eventTs: '2025-08-03T22:13:01.022Z',
				},
			],
		)
	})
})
