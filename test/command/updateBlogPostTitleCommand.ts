import { inc, type AggregateVersion } from '#aggregate/AggregateVersion.ts'
import { ConflictError } from '#error/ConflictError.ts'
import { NotFoundError } from '#error/NotFoundError.ts'
import type { ULID } from '#event/AggregateEvent.ts'
import type { BlogPostTitleChangedEvent } from 'test/event/BlogPostTitleChangedEvent.ts'
import { ulid } from 'ulidx'
import { AggregateNames } from '../aggregate/AggregateNames.ts'
import type { BlogPostAggregate } from '../aggregate/BlogPostAggregate.ts'
import { blogpostReducer } from '../aggregate/blogPostReducer.ts'
import { EventNames } from '../event/EventNames.ts'
import type { FindBlogPostByIdFn } from '../persistence/FindBlogPostByIdFn.ts'
import type { PersistBlogPostFn } from '../persistence/PersistBlogPostFn.ts'

export const updateBlogPostTitleCommand =
	(findBlogPostById: FindBlogPostByIdFn, persistBlogPost: PersistBlogPostFn) =>
	async (
		blogpostId: ULID,
		title: string,
		version: AggregateVersion,
		actorId: string,
	): Promise<BlogPostAggregate> => {
		const maybeBlogPost = await findBlogPostById(blogpostId)
		if (maybeBlogPost === null) {
			throw new NotFoundError(`BlogPost ${blogpostId} not found!`)
		}
		if (maybeBlogPost.$meta.version !== version) {
			throw new ConflictError(
				`BlogPost ${blogpostId} version mismatch! Expected ${version}, got ${maybeBlogPost.$meta.version}`,
			)
		}

		const event: BlogPostTitleChangedEvent = {
			eventId: ulid() as ULID,
			eventName: EventNames.BlogPostTitleChanged,
			aggregateName: AggregateNames.BlogPost,
			aggregateId: maybeBlogPost.$meta.id,
			aggregateVersion: inc(maybeBlogPost.$meta.version),
			title,
			actorId,
		}

		const applied = blogpostReducer([event], maybeBlogPost)

		await persistBlogPost(applied, event)

		return applied
	}
