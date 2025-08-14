import { fromEvent, updateFromEvent } from '#aggregate/AggregateMeta.ts'
import { reduceEvents } from '#aggregate/reducer/reduceEvents.ts'
import { assertAggregateEvent } from '#event/assertAggregateEvent.ts'
import { isNamedEvent } from '#event/isNamedEvent.ts'
import type { BlogPostCreatedEvent } from '../event/BlogPostCreatedEvent.ts'
import type { BlogPostPublishedEvent } from '../event/BlogPostPublishedEvent.ts'
import type { BlogPostTitleChangedEvent } from '../event/BlogPostTitleChangedEvent.ts'
import { EventNames } from '../event/EventNames.ts'
import type { BlogPostAggregate } from './BlogPostAggregate.ts'

export const blogpostReducer = reduceEvents<BlogPostAggregate>(
	(event, aggregate) => {
		if (isBlogPostCreatedEvent(event)) {
			return {
				$meta: fromEvent(event),
				authorId: event.actorId,
				title: event.title,
			}
		}
		if (isBlogPostPublishedEvent(event)) {
			assertAggregateEvent(aggregate, event)
			return {
				...aggregate,
				$meta: updateFromEvent(aggregate.$meta, event),
				isPublic: true,
			}
		}
		if (isBlogPostTitleChangedEvent(event)) {
			assertAggregateEvent(aggregate, event)
			return {
				...aggregate,
				$meta: updateFromEvent(aggregate.$meta, event),
				title: event.title,
			}
		}
		return undefined
	},
)

const isBlogPostCreatedEvent = isNamedEvent<BlogPostCreatedEvent>(
	EventNames.BlogPostCreated,
)

const isBlogPostPublishedEvent = isNamedEvent<BlogPostPublishedEvent>(
	EventNames.BlogPostPublished,
)

const isBlogPostTitleChangedEvent = isNamedEvent<BlogPostTitleChangedEvent>(
	EventNames.BlogPostTitleChanged,
)
