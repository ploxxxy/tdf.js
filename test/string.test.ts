import assert from 'node:assert'
import { describe, it } from 'node:test'
import TdfDecoder from '../src/lib/decoder'
import TdfEncoder from '../src/lib/encoder'
import { TdfString } from '../src/types'

const TEST_STRINGS = [
  '',
  'cem_ea_id',
  'communicationBlockList',
  'тестова стрічка',
]

function compare(string: string) {
  const tdf = new TdfString('TEST', string)
  const encoded = new TdfEncoder().encode([tdf])
  const decoded = new TdfDecoder(encoded).decode()
  const decodedTdf = decoded[0]

  assert.strictEqual(decodedTdf.tag, tdf.tag)
  assert.strictEqual(decodedTdf.type, tdf.type)
  assert.strictEqual(decodedTdf.value, tdf.value)
  assert.strictEqual(decodedTdf.label, tdf.label)
}

describe('TdfString', () => {
  for (const string of TEST_STRINGS) {
    it(`should encode and decode "${string}"`, () => {
      compare(string)
    })
  }
})
