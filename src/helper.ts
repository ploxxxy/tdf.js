const decodeLabel = (tag: Buffer) => {
  let encodedTag = tag.readUIntBE(0, 3)
  const decodedTag = Buffer.alloc(4)

  for (let i = 3; i >= 0; --i) {
    const sixbits = encodedTag & 0x3f
    if (sixbits) {
      decodedTag[i] = sixbits + 32
    } else {
      decodedTag[i] = 0x20
    }
    encodedTag >>= 6
  }

  return decodedTag.toString()
}

const encodeLabel = (tag: string) => {
  if (tag.length !== 4) {
    throw new Error('Tag must be 4 characters long.')
  }

  tag = tag.toUpperCase()

  let encodedTag = 0
  for (let i = 0; i < tag.length; i++) {
    const char = tag[i]
    if (char === ' ') {
      continue
    }
    encodedTag |= (char.charCodeAt(0) - 32) << (6 * (3 - i))
  }

  return Buffer.from([
    (encodedTag >> 16) & 0xff,
    (encodedTag >> 8) & 0xff,
    encodedTag & 0xff,
  ])
}

export { decodeLabel, encodeLabel }
