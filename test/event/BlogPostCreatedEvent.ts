import type { AggregateEvent } from "#event/AggregateEvent.ts";
import type { EventNames } from "./EventNames.ts";

export type BlogPostCreatedEvent = Omit<AggregateEvent, "eventName"> & {
  eventName: typeof EventNames.BlogPostCreated;
  title: string;
};
