import { randomUUID } from 'crypto'

export const testActor = (): string => `test-actor:${randomUUID()}`
