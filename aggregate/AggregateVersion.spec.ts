import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { inc, v, v1 } from './AggregateVersion.ts'

void describe('AggregateVersion helpers', () => {
	void it('v() should wrap a number as AggregateVersion without changing its value', () => {
		const n = 5
		const av = v(n)
		assert.equal(av, n)
		assert.equal(v(1), v1, 'v(1) should equal the predefined v1')
	})

	void it('inc() should increment the aggregate version by 1', () => {
		assert.equal(inc(v1), v(2))
		assert.equal(inc(v(2)), v(3))
		assert.equal(inc(inc(v1)), v(3))
	})
})
