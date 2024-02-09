import { decodeLabel, encodeLabel } from '../src/helper'

const testLabel = Buffer.from([0xd2, 0x5c, 0xf4])

describe('encode label', () => {
  it('should encode string "TEST" into Buffer <d2 5c f4>', () => {
    expect(encodeLabel('TEST')).toEqual(testLabel)
  })
})

describe('decode label', () => {
  it('should encode Buffer <d2 5c f4> into string "TEST"', () => {
    expect(decodeLabel(testLabel)).toEqual('TEST')
  })
})
