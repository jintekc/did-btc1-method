import { ECPairAPI, ECPairFactory } from 'ecpair';
import * as tinysecp from 'tiny-secp256k1';

const privateKeyBytes = new Uint8Array([
  139, 106,  49, 176,  63,  12, 121,  46,
  94, 115, 142, 201,  94,  75, 143, 216,
  210,  68, 197, 137, 232,  63,  63, 178,
  30, 220, 161, 210,  96, 218, 198, 158
]);
const ECPair: ECPairAPI = ECPairFactory(tinysecp);
const keyPair2 = ECPair.fromPrivateKey(privateKeyBytes);
console.log('keyPair2', keyPair2);
const pk = keyPair2.publicKey;
console.log('pk', pk);
