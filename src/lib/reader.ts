import type { Buffer } from 'node:buffer'

export default class BufReader {
  private buffer: Buffer
  private offset: number
  private marker: number

  constructor(buf: Buffer) {
    this.buffer = buf
    this.offset = 0
  }

  readUInt8() {
    const value = this.buffer.readUInt8(this.offset)
    this.offset += 1

    return value
  }

  readUInt16() {
    const value = this.buffer.readUInt16LE(this.offset)
    this.offset += 2

    return value
  }

  readUInt32() {
    const value = this.buffer.readUInt32LE(this.offset)
    this.offset += 4

    return value
  }

  readUInt64() {
    const low = this.readUInt32()
    const high = this.readUInt32()

    return BigInt(low) + (BigInt(high) << 32n)
  }

  readFloat() {
    const value = this.buffer.readFloatBE(this.offset)
    this.offset += 4

    return value
  }

  readBytes(length: number) {
    const value = this.buffer.subarray(this.offset, this.offset + length)
    this.offset += length

    return value
  }

  get remaining() {
    return this.buffer.length - this.offset
  }

  mark() {
    this.marker = this.offset
  }

  reset() {
    this.offset = this.marker
  }
}
