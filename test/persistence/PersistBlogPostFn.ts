import type { PersistFn } from '../../persistence/PersistFn.ts'
import type { BlogPostAggregate } from '../aggregate/BlogPostAggregate.ts'

export type PersistBlogPostFn = PersistFn<BlogPostAggregate>
