import { v1 } from '#aggregate/AggregateVersion.ts'
import { listAggregateEventsDynamoDB } from '#persistence/dynamoDB/listAggregateEventsDynamoDB.ts'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { AggregateNames } from './aggregate/AggregateNames.ts'
import type { BlogPostAggregate } from './aggregate/BlogPostAggregate.ts'
import { createBlogPostCommand } from './command/createBlogPostCommand.ts'
import { updateBlogPostTitleCommand } from './command/updateBlogPostTitleCommand.ts'
import type { BlogPostCreatedEvent } from './event/BlogPostCreatedEvent.ts'
import { EventNames } from './event/EventNames.ts'
import { createTestTables } from './persistence/dynamoDB/createTestTables.ts'
import { findBlogPostByIdDynamoDB } from './persistence/dynamoDB/findBlogPostByIdDynamoDB.ts'
import { persistBlogPostDynamoDB } from './persistence/dynamoDB/persistBlogPostDynamoDB.ts'
import { testActor } from './testActor.ts'

void describe('e2e tests', async () => {
	const db = new DynamoDBClient({
		endpoint: 'http://localhost:8000/',
		region: 'eu-north-1',
		credentials: {
			accessKeyId: 'dummyaccesskey',
			secretAccessKey: 'dummysecretkey',
		},
	})
	const { eventsTableName, blogPostsTableName } = await createTestTables(db)

	const persistBlogPost = persistBlogPostDynamoDB(
		db,
		blogPostsTableName,
		eventsTableName,
	)

	const create = createBlogPostCommand(persistBlogPost)
	const find = findBlogPostByIdDynamoDB(db, blogPostsTableName)
	const listEvents = listAggregateEventsDynamoDB(db, eventsTableName)
	const updateTitle = updateBlogPostTitleCommand(find, persistBlogPost)

	void describe('Create a blog post and retrieve its aggregate and the events', async () => {
		let blogPost: BlogPostAggregate | undefined = undefined
		const author = testActor()

		void it('should create the blog post', async () => {
			blogPost = await create(
				{
					title: 'My first blog post',
				},
				author,
			)
			assert.ok(
				blogPost.$meta.id !== undefined,
				'Blog post ID should be defined',
			)
		})

		void it('should retrieve the persisted blog post', async () => {
			const maybePost = await find(blogPost!.$meta.id)
			assert.deepEqual(maybePost, blogPost)
		})

		void it('should retrieve the events of the blog post', async () => {
			const events = await listEvents(blogPost!.$meta.id)
			assert.ok(events.length > 0, 'Events should be retrieved')
			const expectedEvent: Partial<BlogPostCreatedEvent> = {
				actorId: author,
				aggregateId: blogPost!.$meta.id,
				aggregateName: AggregateNames.BlogPost,
				aggregateVersion: v1,
				eventName: EventNames.BlogPostCreated,
				title: blogPost!.title,
			}
			assert.partialDeepStrictEqual(events[0]!, expectedEvent)
		})
	})

	void describe('Overwriting updates should not work', async () => {
		void it('should not allow overwriting changes of the blog post', async () => {
			const author = testActor()
			const blogPost = await create(
				{
					title: 'A new blog post',
				},
				author,
			)
			assert.ok(
				blogPost.$meta.id !== undefined,
				'Blog post ID should be defined',
			)
			// Some other user updates the post in the mean time
			const updated = await updateTitle(
				blogPost.$meta.id,
				'Another Title',
				v1,
				testActor(),
			)
			assert.equal(updated.$meta.version, 2)
			// This should not cause a lost update
			await assert.rejects(
				async () => updateTitle(blogPost.$meta.id, 'Another Title', v1, author),
				/version mismatch! Expected 1, got 2/,
			)
		})
	})
})
