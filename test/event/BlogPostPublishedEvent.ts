import type { AggregateEvent } from "#event/AggregateEvent.ts"
import type { EventNames } from "./EventNames.ts"

export type BlogPostPublishedEvent = Omit<AggregateEvent, "eventName"> & {
  eventName: typeof EventNames.BlogPostPublished
}
