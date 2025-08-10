import assert from 'node:assert'
import { describe, it } from 'node:test'
import TdfDecoder from '../src/lib/decoder'
import TdfEncoder from '../src/lib/encoder'
import TdfBlazeObjectType, { BlazeObjectType } from '../src/types/object-type'

const TEST_Types: BlazeObjectType[] = [
  {
    componentId: 1,
    typeId: 2,
  },
  {
    componentId: 3,
    typeId: 4,
  },
  {
    componentId: 5,
    typeId: 6,
  },
]

function compare({ componentId, typeId }: BlazeObjectType) {
  const tdf = new TdfBlazeObjectType('TEST', { componentId, typeId })
  const encoded = new TdfEncoder().encode([tdf])
  const decoded = new TdfDecoder(encoded).decode()
  const decodedTdf = decoded[0] as TdfBlazeObjectType

  assert.strictEqual(decodedTdf.tag, tdf.tag)
  assert.strictEqual(decodedTdf.type, tdf.type)

  const { componentId: decodedComponentId, typeId: decodedTypeId } =
    decodedTdf.value
  assert.strictEqual(decodedComponentId, tdf.value.componentId)
  assert.strictEqual(decodedTypeId, tdf.value.typeId)

  assert.strictEqual(decodedTdf.label, tdf.label)
}

describe('TdfInteger', () => {
  for (const type of TEST_Types) {
    it(`should encode and decode ${type.componentId}`, () => {
      compare(type)
    })
  }
})
