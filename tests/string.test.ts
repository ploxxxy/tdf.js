import { Readable } from 'stream'
import { TDF, TDFString } from '../src/tdf'

const stream = new Readable({ read() {} })

const bytes = Buffer.from([
  0xda, 0x1b, 0x35, 0x01, 0x0e, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x57, 0x6f, 0x72, 0x6c,
  0x64, 0x21, 0x00,
])

describe('reading a string', () => {
  it('should read a string with label "VALU" and value "Hello, World!"', () => {
    stream.push(bytes)
    stream.push(null)

    const tdf = TDF.readTDF(stream)

    expect(tdf).toEqual(new TDFString('VALU', 'Hello, World!'))
  })
})

describe('writing a string', () => {
  it('should write a string with label "VALU" and value "Hello, World!"', () => {
    const payload = [new TDFString('VALU', 'Hello, World!')]
    const buffer = Buffer.concat(payload.map((x) => x.write()))

    expect(buffer).toEqual(bytes)
  })
})
