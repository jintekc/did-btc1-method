import { strings } from '@helia/strings';
import { createHelia } from 'helia';
import { CID } from 'multiformats/cid';
import * as Digest from 'multiformats/hashes/digest';
import { sha256 } from '@noble/hashes/sha256';
import { canonicalize } from '@web5/crypto';
import { bech32 } from '@scure/base';
import DidBtc1Utils from '../src/did-btc1-utils.js';

const parsable = (content: string) => {
  try {
    const parsed = JSON.parse(content);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
};
const did = 'did:btc1:x1rfkaxzfh23nrh33llxysztuhssguysnkywexde4wghszrvqc570q7gtfea';
const didDocument = {
  '@context' : [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/multikey/v1',
    'https://github.com/dcdpr/did-btc1'
  ],
  'id'                   : 'did:btc1:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'authentication'       : ['#initialKey'],
  'assertionMethod'      : ['#initialKey'],
  'capabilityInvocation' : ['#initialKey'],
  'capabilityDelegation' : ['#initialKey'],
  'verificationMethod'   : [{
    'id'                 : '#initialKey',
    'type'               : 'Multikey',
    'controller'         : 'did:btc1:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ',
    'publicKeyMultibase' : 'z4jKbyg1bUG6fJwYh4swsUt4YKK2oAd5MJg2tN7je1GtjX2qc'
  }],
  'service' : [
    {
      'id'              : '#initialP2PKH',
      'type'            : 'SingletonBeacon',
      'serviceEndpoint' : 'bitcoin:13Yy4wKBrJbnQWD7ddVW8hhgCm8o6xvp9n'
    },
    {
      'id'              : '#initialP2WPKH',
      'type'            : 'SingletonBeacon',
      'serviceEndpoint' : 'bitcoin:bc1qr0alxy2upt2y5e46zeaayrw04uyzsvrmrkrwa3'
    },
    {
      'id'              : '#initialP2TR',
      'type'            : 'SingletonBeacon',
      'serviceEndpoint' : 'bitcoin:bc1pvq4q6u937m8qx4fv4ldsc5wyykw9784y89p9xvdza28q9r3wlepq54nwvg'
    }
  ]
};
const decoded = bech32.decode('x1rfkaxzfh23nrh33llxysztuhssguysnkywexde4wghszrvqc570q7gtfea');
console.log('decoded', decoded);

const genesisBytes = sha256(Buffer.from(canonicalize(didDocument)));
console.log('genesisBytes', genesisBytes);

const hexDigest = Buffer.from(genesisBytes).toString('hex');
console.log('hexDigest', hexDigest);

const identifierComponents = DidBtc1Utils.parse(did);
console.log('identifierComponents', identifierComponents);

const hashBytes = identifierComponents.genesisBytes;
console.log('hashBytes', hashBytes);

const helia = strings(await createHelia());
const cid = await helia.add(hashBytes.toString(), {});
console.log('cid', cid);
// const cid = CID.create(1, 1, Digest.create(1, hashBytes));
const content = await helia.get(cid, {});
if (!parsable(content)) {
  throw new Error('Invalid DID Document content');
}
const document = JSON.parse(content);
console.log('document', document);