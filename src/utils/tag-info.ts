import { Heat2Util } from './heat2'

function decodeTag(tag: number) {
  tag = tag >>> 8

  const buf: number[] = new Array(Heat2Util.MAX_TAG_LENGTH)

  for (let i = Heat2Util.MAX_TAG_LENGTH - 1; i >= 0; --i) {
    const sixBits = tag & 0x3f
    buf[i] = sixBits !== 0 ? sixBits + 32 : 0x20
    tag >>= 6
  }

  return String.fromCharCode(...buf)
}

function encodeTag(tag: string) {
  tag = tag.toUpperCase().padEnd(Heat2Util.MAX_TAG_LENGTH, ' ')

  let result = 0
  for (let i = 0; i < tag.length; i++) {
    result <<= 6
    result |= (tag.charCodeAt(i) - 32) & 0x3f
  }
  return (result << 8) >>> 0
}

export { decodeTag, encodeTag }
