export const pubkeybytes = [
  2, 51, 135, 28, 237, 18, 176, 47,
  237, 209, 90, 129, 238, 4, 95, 62,
  162, 204, 168, 178, 80, 247, 67, 16,
  98, 185, 59, 173, 154, 188, 38, 87,
  208
];
export const initialdocument = {
  'did'             : 'did:btc1:k1qgecw88dz2czlmw3t2q7upzl863ve29j2rm5xyrzhya6mx4uyetaq70hw44',
  'initialDocument' : {
    '@context' : [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/multikey/v1',
      'https://github.com/dcdpr/did-btc1'
    ],
    'id'             : 'did:btc1:k1qgecw88dz2czlmw3t2q7upzl863ve29j2rm5xyrzhya6mx4uyetaq70hw44',
    'authentication' : [
      '#initialKey'
    ],
    'assertionMethod' : [
      '#initialKey'
    ],
    'capabilityInvocation' : [
      '#initialKey'
    ],
    'capabilityDelegation' : [
      '#initialKey'
    ],
    'verificationMethod' : [
      {
        'id'                 : '#initialKey',
        'type'               : 'Multikey',
        'controller'         : 'did:btc1:k1qgecw88dz2czlmw3t2q7upzl863ve29j2rm5xyrzhya6mx4uyetaq70hw44',
        'publicKeyMultibase' : 'z4jKbs2yMTY3rfCrpTpNwjnfxdmW75yiH4QPGiwmuG5XKNjKm'
      }
    ],
    'service' : [
      {
        'id'              : '#initialP2PKH',
        'type'            : 'SingletonBeacon',
        'serviceEndpoint' : 'bitcoin:12WhRM85ejAq78G6WinLe5LKB6iuXhke9C'
      },
      {
        'id'              : '#initialP2WPKH',
        'type'            : 'SingletonBeacon',
        'serviceEndpoint' : 'bitcoin:bc1qzz27mmtj3f588zw8axzcqjk6qwhv4mqwsmkfx8'
      },
      {
        'id'              : '#initialP2TR',
        'type'            : 'SingletonBeacon',
        'serviceEndpoint' : 'bitcoin:bc1pnswzpxrtjgenyakq6jmd9a6uh49ms8xf45468f7t2q30e686lvespmd8gg'
      }
    ]
  }
};