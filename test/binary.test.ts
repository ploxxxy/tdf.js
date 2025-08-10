import assert from 'node:assert'
import { describe, it } from 'node:test'
import TdfDecoder from '../src/lib/decoder'
import TdfEncoder from '../src/lib/encoder'
import { TdfBinary } from '../src/types'

const TEST_BUFFERS = [
  Buffer.from([0xde, 0xad, 0xbe, 0xef]),
  Buffer.from([0x12, 0x34, 0x56, 0x78]),
  Buffer.from([0x9a, 0xbc, 0xde, 0xf0]),
]

function compare(buffer: Buffer) {
  const tdf = new TdfBinary('TEST', buffer)
  const encoded = new TdfEncoder().encode([tdf])
  const decoded = new TdfDecoder(encoded).decode()
  const decodedTdf = decoded[0] as TdfBinary

  assert.strictEqual(decodedTdf.tag, tdf.tag)
  assert.strictEqual(decodedTdf.type, tdf.type)
  assert.strictEqual(
    decodedTdf.value.toString('hex'),
    tdf.value.toString('hex')
  )
  assert.strictEqual(decodedTdf.label, tdf.label)
}

describe('TdfBinary', () => {
  for (const buffer of TEST_BUFFERS) {
    it(`should encode and decode 0x${buffer.toString('hex')}`, () => {
      compare(buffer)
    })
  }
})
