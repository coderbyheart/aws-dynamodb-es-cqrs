import type { ULID } from '#event/AggregateEvent.ts'
import type { BlogPostAggregate } from '../aggregate/BlogPostAggregate.ts'

export type FindBlogPostByIdFn = (id: ULID) => Promise<BlogPostAggregate | null>
