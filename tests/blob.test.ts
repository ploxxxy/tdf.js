import { Readable } from 'stream'
import { TDF, TDFBlob } from '../src/tdf'

const stream = new Readable({ read() {} })

const bytes = Buffer.from([0x8a, 0xcb, 0xe2, 0x02, 0x00])

console.log('Skipping Blob test')

describe.skip('reading a blob', () => {
  it('should read a blob with label "VALU" and value "0xdeadbeef"', () => {
    stream.push(bytes)
    stream.push(null)

    const tdf = TDF.readTDF(stream)

    console.log(tdf)

    expect(tdf).toEqual(new TDFBlob('VALU', Buffer.from('0xdeadbeef', 'hex')))
  })
})

describe.skip('writing a blob', () => {
  it('should write a blob with label "VALU" and value "0xdeadbeef"', () => {
    const payload = [new TDFBlob('VALU', Buffer.from('0xdeadbeef', 'hex'))]
    const buffer = Buffer.concat(payload.map((x) => x.write()))

    expect(buffer).toEqual(bytes)
  })
})
