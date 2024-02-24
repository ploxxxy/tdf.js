import { Readable } from 'stream'
import { TDF, TDFString } from '../src/tdf'

const stream = new Readable({
  read() {},
})

const testString = Buffer.from([
  0xd2, 0x5c, 0xf4, 0x01, 0x0c, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f,
  0x72, 0x6c, 0x64, 0x00,
])

const testLabel = Buffer.from([0xd2, 0x5c, 0xf4])

describe('encode label', () => {
  it('should encode string "TEST" into Buffer <d2 5c f4>', () => {
    expect(TDF.encodeLabel('TEST')).toEqual(testLabel)
  })
})

describe('decode label', () => {
  it('should encode Buffer <d2 5c f4> into string "TEST"', () => {
    expect(TDF.decodeLabel(testLabel)).toEqual('TEST')
  })
})

describe('building a TDFString', () => {
  it('should build a TDFString with label "TEST" and value "hello world"', () => {
    const tdfString = new TDFString('TEST', 'hello world')
    const buffer = tdfString.write()

    expect(buffer).toEqual(testString)
  })
})

describe('reading a TDFString', () => {
  it('should read a TDFSring with label "TEST" and value "hello world"', () => {
    stream.push(testString)
    stream.push(null)

    const tdfString = TDF.readTDF(stream)

    expect(tdfString).toEqual(new TDFString('TEST', 'hello world'))
  })
})
