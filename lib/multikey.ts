import SchnorrSecp256k1Multikey from '../src/data-integrity/schnorr-secp256k1-multikey.js';
import { GeneralUtils } from '../src/utils/general.js';

const pubkeys = Array.from({ length: 10 }).map(_ => GeneralUtils.generateSecp256k1KeyPair().publicKey);
const base58btc1Keys = pubkeys.map(pubkey => SchnorrSecp256k1Multikey.encode(pubkey));
console.log('Base58 BTC1 Keys', base58btc1Keys);