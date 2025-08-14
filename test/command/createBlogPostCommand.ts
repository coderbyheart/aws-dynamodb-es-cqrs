import { v1 } from '#aggregate/AggregateVersion.ts'
import type { ULID } from '#event/AggregateEvent.ts'
import { ulid } from 'ulidx'
import { AggregateNames } from '../aggregate/AggregateNames.ts'
import type { BlogPostAggregate } from '../aggregate/BlogPostAggregate.ts'
import { blogpostReducer } from '../aggregate/blogPostReducer.ts'
import type { BlogPostCreatedEvent } from '../event/BlogPostCreatedEvent.ts'
import { EventNames } from '../event/EventNames.ts'
import type { PersistBlogPostFn } from '../persistence/PersistBlogPostFn.ts'

export const createBlogPostCommand =
	(persistBlogPost: PersistBlogPostFn) =>
	async (
		data: Omit<BlogPostAggregate, '$meta' | 'authorId'>,
		actorId: string,
	): Promise<BlogPostAggregate> => {
		const id = ulid() as ULID
		const event: BlogPostCreatedEvent = {
			eventId: ulid() as ULID,
			eventName: EventNames.BlogPostCreated,
			aggregateName: AggregateNames.BlogPost,
			aggregateId: id,
			aggregateVersion: v1,
			actorId,
			...data,
		}

		const applied = blogpostReducer([event])

		await persistBlogPost(applied, event)

		return applied
	}
