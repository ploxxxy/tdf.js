import { Readable } from 'stream'
import { TDF, TDFInteger, TDFString, TDFStruct } from '../src/tdf'

const stream = new Readable({ read() {} })

const bytes = Buffer.from([
  0xcf, 0x4c, 0xa3, 0x03, 0xa6, 0xed, 0x00, 0x00, 0x2a, 0xcf, 0x4c, 0x80, 0x01, 0x0e, 0x4e, 0x65,
  0x73, 0x74, 0x65, 0x64, 0x20, 0x73, 0x74, 0x72, 0x75, 0x63, 0x74, 0x00, 0x00,
])

describe('reading a struct', () => {
  it('should read a struct with label "STRC" and nested content', () => {
    stream.push(bytes)
    stream.push(null)

    const tdf = TDF.readTDF(stream)

    expect(tdf).toEqual(
      new TDFStruct('STRC', [new TDFInteger('INT ', 42), new TDFString('STR ', 'Nested struct')])
    )
  })
})

describe('writing a struct', () => {
  it('should write a struct with label "STRC" and nested content', () => {
    const payload = [
      new TDFStruct('STRC', [new TDFInteger('INT ', 42), new TDFString('STR ', 'Nested struct')]),
    ]
    const buffer = Buffer.concat(payload.map((x) => x.write()))

    expect(buffer).toEqual(bytes)
  })
})
