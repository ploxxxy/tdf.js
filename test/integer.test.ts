import { describe, it } from 'node:test'
import { TdfInteger } from '../src/types'
import TdfEncoder from '../src/lib/encoder'
import TdfDecoder from '../src/lib/decoder'
import assert from 'node:assert'

const TEST_NUMBERS = [0, 4, 2000, 133713371337, 9007199254740992n]

function compare(number: number | bigint) {
  const tdf = new TdfInteger('TEST', number)
  const encoded = new TdfEncoder().encode([tdf])
  const decoded = new TdfDecoder(encoded).decode()
  const decodedTdf = decoded[0]

  assert.strictEqual(decodedTdf.tag, tdf.tag)
  assert.strictEqual(decodedTdf.type, tdf.type)
  assert.strictEqual(decodedTdf.value, tdf.value)
  assert.strictEqual(decodedTdf.label, tdf.label)
}

describe('TdfInteger', () => {
  for (const number of TEST_NUMBERS) {
    it(`should encode and decode ${number}`, () => {
      compare(number)
    })
  }
})
