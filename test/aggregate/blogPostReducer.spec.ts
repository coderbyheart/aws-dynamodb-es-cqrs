import type { ULID } from '#event/AggregateEvent.ts'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ulid } from 'ulidx'
import type { BlogPostCreatedEvent } from '../event/BlogPostCreatedEvent.ts'
import type { BlogPostPublishedEvent } from '../event/BlogPostPublishedEvent.ts'
import type { BlogPostTitleChangedEvent } from '../event/BlogPostTitleChangedEvent.ts'
import { EventNames } from '../event/EventNames.ts'
import { testActor } from '../testActor.ts'
import type { BlogPostAggregate } from './BlogPostAggregate.ts'
import { blogpostReducer } from './blogPostReducer.ts'

const aggregateName = 'BlogPost'

const createBlogPostCreatedEvent = (): BlogPostCreatedEvent => ({
	// AggregateEvent fields
	eventId: ulid() as ULID,
	eventName: EventNames.BlogPostCreated,
	aggregateName,
	aggregateId: ulid() as ULID,
	aggregateVersion: 1 as any,
	actorId: testActor(),
	// BlogPostCreatedEvent specific
	title: 'A title',
})

const createBlogPostPublishedEvent = (
	aggregate: BlogPostAggregate,
): BlogPostPublishedEvent => ({
	eventId: ulid() as ULID,
	eventName: EventNames.BlogPostPublished,
	aggregateName,
	aggregateId: aggregate.$meta.id,
	aggregateVersion: 2 as any,
	actorId: testActor(),
})

const createBlogPostTitleChangedEvent = (
	aggregate: BlogPostAggregate,
	title: string,
): BlogPostTitleChangedEvent => ({
	eventId: ulid() as ULID,
	eventName: EventNames.BlogPostTitleChanged,
	aggregateName,
	aggregateId: aggregate.$meta.id,
	aggregateVersion: 2 as any,
	actorId: testActor(),
	title,
})

void describe('blogpostReducer()', () => {
	void it('should build a blogpost aggregate from BlogPostCreated', () => {
		const created = createBlogPostCreatedEvent()
		const blogpost = blogpostReducer([created])
		assert.equal(blogpost.authorId, created.actorId)
		assert.equal(blogpost.$meta.id, created.aggregateId)
		assert.equal(blogpost.$meta.version, 1)
		assert.deepEqual(blogpost.title, created.title)
	})

	void it('should publish a blogpost', () => {
		const created = createBlogPostCreatedEvent()
		const agg1 = blogpostReducer([created])
		const published = createBlogPostPublishedEvent(agg1)
		const blogpost = blogpostReducer([created, published])
		assert.equal(blogpost.isPublic, true)
		assert.equal(blogpost.$meta.version, 2)
	})

	void it('should throw when applying SizedPhotoAdded without existing aggregate', () => {
		const created = createBlogPostCreatedEvent()
		const agg1 = blogpostReducer([created])
		const sized = createBlogPostPublishedEvent(agg1)
		// Break by removing the create event
		assert.throws(
			() => blogpostReducer([sized as any]),
			/requires an aggregate/,
		)
	})

	void it('should throw when applying event for different aggregate id', () => {
		const created = createBlogPostCreatedEvent()
		const blogpost = blogpostReducer([created])
		const wrongDeleted = createBlogPostPublishedEvent({
			...blogpost,
			$meta: {
				...blogpost.$meta,
				id: ulid() as ULID,
			},
		})
		assert.throws(
			() => blogpostReducer([created, wrongDeleted]),
			/targets different aggregate/,
		)
	})

	void it('should increment version for each subsequent event', () => {
		const created = createBlogPostCreatedEvent()
		const agg1 = blogpostReducer([created])
		const sized1 = createBlogPostTitleChangedEvent(agg1, 'New title')
		const sized2 = createBlogPostTitleChangedEvent(agg1, 'Another title')
		const blogpost = blogpostReducer([created, sized1, sized2])
		assert.equal(blogpost.$meta.version, 3)
		assert.equal(blogpost.title, 'Another title')
	})
})
