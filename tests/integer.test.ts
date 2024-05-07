import { Readable } from 'stream'
import { TDF, TDFInteger } from '../src/tdf'

const stream = new Readable({ read() {} })

const bytes = Buffer.from([0xda, 0x1b, 0x35, 0x00, 0xb9, 0x14])

describe('reading an integer', () => {
  it('should read an integer with label "VALU" and value "1337"', () => {
    stream.push(bytes)
    stream.push(null)

    const tdf = TDF.readTDF(stream)

    expect(tdf).toEqual(new TDFInteger('VALU', 1337))
  })
})

describe('writing an integer', () => {
  it('should write an integer with label "VALU" and value "1337"', () => {
    const payload = [new TDFInteger('VALU', 1337)]
    const buffer = Buffer.concat(payload.map((x) => x.write()))

    expect(buffer).toEqual(bytes)
  })
})
