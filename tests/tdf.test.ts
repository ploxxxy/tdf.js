import { Readable } from 'stream'
import { TDF, TDFString } from '../src/tdf'

const stream = new Readable({
  read() {},
})

const testString = Buffer.from([
  0xd2, 0x5c, 0xf4, 0x01, 0x0c, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f,
  0x72, 0x6c, 0x64, 0x00,
])

describe('building a TDFString', () => {
  it('should build a TDFString with label "TEST" and value "hello world"', () => {
    const tdfString = new TDFString('TEST', 'hello world')
    tdfString.write(stream)

    expect(stream.read()).toEqual(testString)
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
