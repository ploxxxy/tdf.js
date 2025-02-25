import { Heat2Util } from './heat2'

function decodeTag(tag: bigint) {
  const buf: number[] = new Array(Heat2Util.MAX_TAG_LENGTH)

  tag >>= 8n
  for (let i = 3; i >= 0; --i) {
    const sixBits = tag & 0x3fn
    if (sixBits !== 0n) {
      buf[i] = Number(sixBits + 32n)
    } else {
      buf[i] = 0x20
    }
    tag >>= 6n
  }

  let result = ''
  for (let i = 0; i <= buf.length; i++) {
    result += String.fromCharCode(buf[i])
  }

  return result
}

function encodeTag(tag: string) {
  tag = tag.toUpperCase().padEnd(Heat2Util.MAX_TAG_LENGTH, ' ')

  let result = 0n
  for (let i = 0; i < tag.length; i++) {
    result <<= 6n
    result |= BigInt(tag.charCodeAt(i) - 32)
  }
  return result << 8n
}

export { 
  decodeTag,
  encodeTag
}
