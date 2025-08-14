import { inc, v, v1 } from '#aggregate/AggregateVersion.ts'
import type { ULID } from '#event/AggregateEvent.ts'
import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { ulid } from 'ulidx'
import { AggregateNames } from '../aggregate/AggregateNames.ts'
import { testBlogPost } from '../aggregate/testBlogPost.ts'
import type { BlogPostPublishedEvent } from '../event/BlogPostPublishedEvent.ts'
import { EventNames } from '../event/EventNames.ts'
import type { FindBlogPostByIdFn } from '../persistence/FindBlogPostByIdFn.ts'
import type { PersistBlogPostFn } from '../persistence/PersistBlogPostFn.ts'
import { testActor } from '../testActor.ts'
import { publishBlogPostCommand } from './publishBlogPostCommand.ts'

void describe('publishBlogPostCommand()', () => {
	void it('should published a BlogPost and persist it', async () => {
		const existingBlogPost = testBlogPost()
		const persistMock = mock.fn<PersistBlogPostFn>(async () =>
			Promise.resolve(true),
		)
		const findMock = mock.fn<FindBlogPostByIdFn>(async () =>
			Promise.resolve(existingBlogPost),
		)
		const publish = publishBlogPostCommand(findMock, persistMock)

		const adminActorId = testActor()
		const BlogPost = await publish(existingBlogPost.$meta.id, v1, adminActorId)

		assert.partialDeepStrictEqual(BlogPost, {
			$meta: {
				actorId: adminActorId,
				version: v(2),
			},
			isPublic: true,
		})

		const expectedEvent: Partial<BlogPostPublishedEvent> = {
			eventName: EventNames.BlogPostPublished,
			aggregateName: AggregateNames.BlogPost,
			aggregateId: BlogPost.$meta.id,
			aggregateVersion: v(2),
			actorId: adminActorId,
		}

		assert.partialDeepStrictEqual(
			persistMock.mock.calls[0]?.arguments[0],
			BlogPost,
		)
		assert.partialDeepStrictEqual(
			persistMock.mock.calls[0]?.arguments[1],
			expectedEvent,
		)
	})

	void it('should throw an error if the BlogPost does not exist', async () => {
		const persistMock = mock.fn<PersistBlogPostFn>(async () =>
			Promise.resolve(true),
		)
		const findMock = mock.fn<FindBlogPostByIdFn>(async () =>
			Promise.resolve(null),
		)

		const publish = publishBlogPostCommand(findMock, persistMock)

		const id = ulid() as ULID
		await assert.rejects(
			async () => {
				await publish(id, v1, testActor())
			},
			{
				name: 'NotFoundError',
				message: `BlogPost ${id} not found!`,
			},
		)
	})

	void it('should throw an error if the BlogPost version does not match', async () => {
		const existingBlogPost = testBlogPost()
		const persistMock = mock.fn<PersistBlogPostFn>(async () =>
			Promise.resolve(true),
		)
		const findMock = mock.fn<FindBlogPostByIdFn>(async () =>
			Promise.resolve(existingBlogPost),
		)

		const publish = publishBlogPostCommand(findMock, persistMock)

		await assert.rejects(
			async () => {
				await publish(existingBlogPost.$meta.id, inc(v1), testActor())
			},
			{
				name: 'ConflictError',
				message: `BlogPost ${existingBlogPost.$meta.id} version mismatch! Expected ${v1 + 1}, got ${v1}`,
			},
		)
	})
})
