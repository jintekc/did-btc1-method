import { KeyPair } from '../src/utils/keypair';

const cKeyPairs = Array.from({ length: 10 }).map(_ => new KeyPair());
console.log('cKeyPairs', cKeyPairs);