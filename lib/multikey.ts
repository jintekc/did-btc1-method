// import { Bip340MultikeyUtils } from '@did-btc1/key-manager';
// import { utils, getPublicKey } from '@noble/secp256k1';
import { KeyPair } from '../src/utils/keypair';

// const createKeys = (c: boolean) => {
//   const privKey = utils.randomPrivateKey();
//   const pubKey = getPublicKey(privKey, c);
//   return pubKey;
// };

const cKeyPairs = Array.from({ length: 10 }).map(_ => new KeyPair());
console.log('cKeyPairs', cKeyPairs);
// const uncompressedPubkeys = Array.from({ length: 10 }).map(_ => createKeys(false));
// console.log('uncompressedPubkeys', uncompressedPubkeys);
