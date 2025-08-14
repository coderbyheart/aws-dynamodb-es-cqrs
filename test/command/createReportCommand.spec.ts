import { v1 } from '#aggregate/AggregateVersion.ts'
import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { AggregateNames } from '../aggregate/AggregateNames.ts'
import type { BlogPostAggregate } from '../aggregate/BlogPostAggregate.ts'
import type { BlogPostCreatedEvent } from '../event/BlogPostCreatedEvent.ts'
import { EventNames } from '../event/EventNames.ts'
import type { PersistBlogPostFn } from '../persistence/PersistBlogPostFn.ts'
import { testActor } from '../testActor.ts'
import { createBlogPostCommand } from './createBlogPostCommand.ts'

void describe('createBlogPostCommand()', () => {
	void it('should create a blogpost and persist it', async () => {
		const persistMock = mock.fn<PersistBlogPostFn>(async () =>
			Promise.resolve(true),
		)
		const create = createBlogPostCommand(persistMock)

		const data: Omit<BlogPostAggregate, '$meta' | 'authorId'> = {
			title: 'A title.',
		}
		const actorId = testActor()
		const blogpost = await create(data, actorId)

		assert.partialDeepStrictEqual(blogpost, {
			authorId: actorId,
			title: data.title,
		})

		assert.partialDeepStrictEqual(blogpost.$meta, {
			actorId,
			version: 1,
		})

		assert.ok(blogpost.$meta.id !== undefined, 'BlogPost ID should be defined')

		const expectedEvent: Partial<BlogPostCreatedEvent> = {
			eventName: EventNames.BlogPostCreated,
			aggregateName: AggregateNames.BlogPost,
			aggregateId: blogpost.$meta.id,
			aggregateVersion: v1,
			actorId,
			...data,
		}

		assert.partialDeepStrictEqual(
			persistMock.mock.calls[0]?.arguments[0],
			blogpost,
		)
		assert.partialDeepStrictEqual(
			persistMock.mock.calls[0]?.arguments[1],
			expectedEvent,
		)
	})
})
