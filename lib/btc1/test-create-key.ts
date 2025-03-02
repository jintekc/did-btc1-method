import { DidBtc1 } from '../../src/did-btc1.js';
// import { versions, networks, idTypes } from '../tests/test-data.js';
// const idType = idTypes.key;
// tr
// 029e0701b3e117a7358e9e37376b9174da15bbe12b4808c092c1c9ab4639494f33
// legacy
// parent tprv: tprv8ZgxMBicQKsPemKdkJo95pEgsZ97bwdKpZDyAdzQdWy1ktyjwjzLSeVdQo8HuRSzukHPPz469jPzH7M6d9fDTAHhK8GmQTYEkvUtsMEjbka
// public key encoded: mpVSuBsLpCyeKAjbHrTxwF7sLhsdHdNo5C
// public key hex: 030a6d40df2fc34574e3eae72b10c788b53374243ba3accf0bdcee9d0fac16aec3
/*
[
  108, 191, 191,  79, 209, 154,  79, 229,
  156,  39, 245, 171, 104, 178, 104,  10,
  17, 127, 174, 171,  60,  42, 240,  53,
  127, 149,  41, 206, 136,  64, 201,  42
]
*/
const publicKey = new Uint8Array([
  2, 154, 213, 246, 168,  93,  39, 238,
  105, 177,  51, 174, 210, 115, 180, 242,
  245, 215,  14, 212, 167,  22, 117,   1,
  156,  26, 118, 240,  76, 102,  53,  38,
  239
]);
if(!publicKey) {
  throw new Error('Failed to generate public key from private key');
}
// const keypair = new KeyPair(privateKey);
// console.log('keypair', keypair);
console.log('Creating BTC1 Identifier with publicKey:', publicKey);

const response = await DidBtc1.create({ publicKey });
const clean = JSON.stringify(response, null, 4);
console.log('Created BTC1 Identifier and Initial Document:', clean);

// const responses = await Promise.all(
//     versions
//         .flatMap(version => networks.map(network => [version, network]))
//         .map(async ([version, network]) =>
//             await DidBtc1.create({
//                 pubKeyBytes,
//                 options: { version, network, idType },
//             }))
// );
// console.log(`Created ${responses.length} BTC1 Key Ids with versions and networks`);
// console.log('BTC1 Key Id Creation Responses:', JSON.stringify(responses, null, 4));
