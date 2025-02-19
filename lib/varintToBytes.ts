function varintToBytes(value: number): Uint8Array {
  if (value < 0 || value > 0xFFFF) {
    throw new Error('Value out of range for 2-byte varint encoding.');
  }

  // Convert to big-endian 2-byte representation
  return new Uint8Array([(value >> 8) & 0xff, value & 0xff]);
}

// Convert 0x2561 to bytes
const varintBytes = varintToBytes(0x2561);
console.log(Buffer.from(varintBytes));  // Output: <Buffer e1 4a>
