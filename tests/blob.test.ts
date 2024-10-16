import { Readable } from 'stream'
import { TDF, TDFBlob } from '../src/tdf'

const stream = new Readable({ read() {} })

const bytes = Buffer.from([0x8a, 0xcb, 0xe2, 0x02, 0x04, 0xde, 0xad, 0xbe, 0xef])


describe('reading a blob', () => {
  it('should read a blob with label "BLOB" and value "0xdeadbeef"', () => {
    stream.push(bytes)
    stream.push(null)

    const tdf = TDF.readTDF(stream)

    expect(tdf).toEqual(new TDFBlob('BLOB', Buffer.from('deadbeef', 'hex')))
  })
})

describe('writing a blob', () => {
  it('should write a blob with label "BLOB" and value "0xdeadbeef"', () => {
    const payload = [new TDFBlob('BLOB', Buffer.from('deadbeef', 'hex'))]
    const buffer = Buffer.concat(payload.map((x) => x.write()))

    expect(buffer).toEqual(bytes)
  })
})
