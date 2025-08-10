import { Buffer } from 'node:buffer'

export default class BufWriter {
  private _buffer: Buffer
  private offset = 0

  constructor(initialSize = 1024) {
    this._buffer = Buffer.alloc(initialSize)
  }

  private ensureCapacity(length: number) {
    if (this.offset + length > this._buffer.length) {
      const newBuffer = Buffer.alloc(
        Math.max(this._buffer.length * 2, this._buffer.length + length)
      )
      this._buffer.copy(newBuffer)
      this._buffer = newBuffer
    }
  }

  writeUint8(value: number) {
    this.ensureCapacity(1)
    this._buffer.writeUInt8(value, this.offset)
    this.offset += 1
  }

  writeUint16(value: number) {
    this.ensureCapacity(2)
    this._buffer.writeUInt16LE(value, this.offset)
    this.offset += 2
  }

  writeUint32(value: number) {
    this.ensureCapacity(4)
    this._buffer.writeUInt32LE(value, this.offset)
    this.offset += 4
  }

  writeUint64(value: bigint) {
    this.ensureCapacity(8)
    this.writeUint32(Number(value & 0xffffffffn))
    this.writeUint32(Number(value >> 32n))
  }

  writeFloat(value: number) {
    this.ensureCapacity(4)
    this._buffer.writeFloatLE(value, this.offset)
    this.offset += 4
  }

  writeBytes(value: Buffer) {
    this.ensureCapacity(value.length)
    value.copy(this._buffer, this.offset)
    this.offset += value.length
  }

  get buffer() {
    return this._buffer.subarray(0, this.offset)
  }
}
