import type { AggregateEvent } from '#event/AggregateEvent.ts'
import type { EventNames } from './EventNames.ts'

export type BlogPostTitleChangedEvent = Omit<AggregateEvent, 'eventName'> & {
	eventName: EventNames.BlogPostTitleChanged
	title: string
}
