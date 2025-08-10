import assert from 'node:assert'
import { describe, it } from 'node:test'
import TdfDecoder from '../src/lib/decoder'
import TdfEncoder from '../src/lib/encoder'
import { TdfBlazeObjectId } from '../src/types'
import { BlazeObjectId } from '../src/types/object-id'

const TEST_IDS: BlazeObjectId[] = [
  {
    componentId: 1,
    entityId: 2,
    typeId: 3,
  },
  {
    componentId: 4,
    entityId: 5,
    typeId: 6,
  },
  {
    componentId: 7,
    entityId: 8,
    typeId: 9,
  },
]

function compare({ componentId, entityId, typeId }: BlazeObjectId) {
  const tdf = new TdfBlazeObjectId('TEST', { componentId, entityId, typeId })
  const encoded = new TdfEncoder().encode([tdf])
  const decoded = new TdfDecoder(encoded).decode()
  const decodedTdf = decoded[0] as TdfBlazeObjectId

  assert.strictEqual(decodedTdf.tag, tdf.tag)
  assert.strictEqual(decodedTdf.type, tdf.type)

  const {
    componentId: decodedComponentId,
    entityId: decodedEntityId,
    typeId: decodedTypeId,
  } = decodedTdf.value
  assert.strictEqual(decodedComponentId, tdf.value.componentId)
  assert.strictEqual(decodedEntityId, tdf.value.entityId)
  assert.strictEqual(decodedTypeId, tdf.value.typeId)

  assert.strictEqual(decodedTdf.label, tdf.label)
}

describe('TdfInteger', () => {
  for (const id of TEST_IDS) {
    it(`should encode and decode ${id.componentId}`, () => {
      compare(id)
    })
  }
})
