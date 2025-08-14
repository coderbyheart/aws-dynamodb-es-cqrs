import type { ULID } from '#event/AggregateEvent.ts'
import { ulid } from 'ulidx'
import { v1 } from '../../aggregate/AggregateVersion.ts'
import { testActor } from '../testActor.ts'
import type { BlogPostAggregate } from './BlogPostAggregate.ts'

export const testBlogPost = (): BlogPostAggregate => {
	const actorId = testActor()
	return {
		$meta: {
			actorId,
			id: ulid() as ULID,
			version: v1,
		},
		authorId: actorId,
		title: 'The title.',
	}
}
