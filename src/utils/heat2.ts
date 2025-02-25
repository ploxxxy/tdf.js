const Heat2Util = {
  VARSIZE_MORE: 0x80,
  VARSIZE_NEGATIVE: 0x40,
  HEADER_TYPE_OFFSET: 3,
  HEADER_SIZE: 4,
  MAX_TAG_LENGTH: 4,
} as const

export { Heat2Util }
