import { varint } from 'multiformats/basics';

export const ID_PLACEHOLDER_VALUE = 'did:btc1:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
export const MULTIKEY_HEADER = 0x2561;
export const SECP256K1_XONLY_PUBLIC_KEY_PREFIX = varint.encodeTo(MULTIKEY_HEADER, new Uint8Array());
export const OP_RETURN = 0x6a;
export const OP_PUSH32 = 0x20;

export const MULTIBASE_URI_PREFIX = 'urn:mb:';