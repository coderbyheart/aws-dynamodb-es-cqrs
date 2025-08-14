export type AggregateVersion = number & {
	readonly AggregateVersion: unique symbol
}

export const v1 = 1 as AggregateVersion

export const v = (version: number): AggregateVersion =>
	version as AggregateVersion

export const inc = (version: AggregateVersion): AggregateVersion =>
	v(version + 1)
