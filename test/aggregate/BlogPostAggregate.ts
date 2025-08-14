import type { AggregateMeta } from '#aggregate/AggregateMeta.ts'

export type BlogPostAggregate = {
	$meta: AggregateMeta
	authorId: string
	title: string
	isPublic?: boolean
}
