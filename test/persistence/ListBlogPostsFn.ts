import type { BlogPostAggregate } from '../aggregate/BlogPostAggregate.ts'

export type ListBlogPostsFn = () => Promise<Array<BlogPostAggregate>>
