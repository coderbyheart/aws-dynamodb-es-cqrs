import type { AggregateEvent } from './AggregateEvent.ts'
import { isAggregateEvent } from './isAggregateEvent.ts'

export const isNamedEvent =
	<Event extends AggregateEvent>(eventName: string) =>
	(event: unknown): event is Event =>
		isAggregateEvent(event) && event.eventName === eventName
