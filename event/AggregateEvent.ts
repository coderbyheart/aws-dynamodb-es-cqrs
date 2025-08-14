import type { AggregateVersion } from '../aggregate/AggregateVersion.ts'

/**
 * @example 01ARZ3NDEKTSV4RRFFQ69G5FAV
 */
export type ULID = string & {
	readonly ULID: unique symbol
}

/**
 * Describes an event that changes the state of an Aggregate
 */
export type AggregateEvent = {
	eventId: ULID
	eventName: string
	aggregateName: string
	aggregateId: ULID
	/**
	 * The version of the aggregate after this event was applied
	 */
	aggregateVersion: AggregateVersion
	/**
	 * The id of the actor that triggered the event
	 */
	actorId: string
}
