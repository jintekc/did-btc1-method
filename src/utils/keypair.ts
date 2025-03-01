import { getPublicKey, utils } from '@noble/secp256k1';
import { Bytes } from '../types/btc1.js';

export class KeyPair {
  public type: string = 'secp256k1';
  public compressed: boolean = true;
  public publicKey?: Bytes;
  protected _privateKey?: Bytes;

  constructor(privateKey?: Bytes, publicKey?: Bytes) {
    if(!privateKey && !publicKey)
      console.info('KeyPair: No keys provided, generating new key pair');
    const keys = KeyPair.generate();
    this._privateKey = privateKey ?? keys.privateKey;
    this.publicKey = !publicKey && !privateKey
      ? keys.publicKey
      : !publicKey && privateKey
        ? getPublicKey(privateKey, true)
        : publicKey;
  }

  get privateKey(): Bytes {
    if(!this._privateKey) {
      throw new Error('Private key not set');
    }
    return this._privateKey!;
  }

  static generate(){
    const privateKey = utils.randomPrivateKey();
    if(!utils.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key');
    }
    return { privateKey, publicKey: getPublicKey(privateKey, true) };
  };
}