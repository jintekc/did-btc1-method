import { schnorr } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { utils, CURVE, getPublicKey } from '@noble/secp256k1';
import { HDKey } from '@scure/bip32';
import { generateMnemonic, mnemonicToSeed } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { canonicalize } from '@web5/crypto';
import { JSONObject } from '../exts.js';
import { KeyPair } from '../types/btc1.js';
import { HdWallet } from '../types/crypto.js';

/**
 * Static class of general utility functions for the did-btc1 spec implementation
 * @class GeneralUtils
 * @type {GeneralUtils}
 */
export class GeneralUtils {
  /**
   * Converts a bigint to a buffer
   * @static
   * @param {bigint} value The bigint to convert
   * @returns {Buffer} The buffer representation of the bigint
   */
  static bigintToBuffer(value: bigint): Buffer {
    const hex = value.toString(16).padStart(64, '0');
    return Buffer.from(hex, 'hex');
  }


  /**
   * Generate a new Schnorr key pair
   * @static
   * @returns {KeyPair}
   * @throws {Error} if the private key is invalid
   */
  static generateSchnorrKeyPair(): KeyPair {
    // Generate a random private key
    const privateKey = schnorr.utils.randomPrivateKey();
    // Ensure the private key is valid, throw an error if not valid
    if (!utils.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key');
    }
    // Generate public key from private key
    const publicKey = schnorr.getPublicKey(privateKey);
    // Return the keypair
    return { privateKey, publicKey };
  }

  /**
   * Generates a new mnemonic phrase and HD wallet
   * @static @async @method
   * @returns {HdWallet} Promise resolving to a new hdwallet object w/ mnemonic and hdkey
   * @throws {Error} if the public key bytes cannot be derived
   */
  static async generateHdWallet(): Promise<HdWallet> {
    // Generate random mnemonic phrase.
    const mnemonic = generateMnemonic(wordlist, 128);
    // Generate seed from random mnemonic phrase.
    const seed = await mnemonicToSeed(mnemonic);
    // Generate HDKey from seed.
    const hdkey = HDKey.fromMasterSeed(seed);
    // Ensure HDKey returns valid
    if (!hdkey) {
      throw new Error('Failed to derive hd wallet');
    }
    return { mnemonic, hdkey };
  }

  static generateCompressedSecp256k1KeyPair(){
    const privateKey = utils.randomPrivateKey();
    if(!utils.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key');
    }
    return { privateKey, publicKey: getPublicKey(privateKey, true) };
  };

  /**
   * Recovers an HDKey from a mnemonic phrase
   * @static @async @method
   * @param {string} mnemonic The mnemonic phrase to recover the HDKey from
   * @param {Uint8Array} seed Optional seed to recover the HDKey from
   * @returns {HDKey} Promise resolving to the recovered HDKey
   * @throws Error if the HDKey cannot be recovered
   */
  static async recoverHdWallet(mnemonic: string, seed?: Uint8Array): Promise<HDKey> {
    seed ??= await mnemonicToSeed(mnemonic);
    // Generate HDKey from seed.
    const hdkey = HDKey.fromMasterSeed(seed);
    // Ensure HDKey returns valid
    if (!hdkey) {
      throw new Error('Failed to recover hdkey');
    }
    // Return the HDKey
    return hdkey;
  }

  /**
   * Recovers a secp256k1 privateKey from its original entropy
   * @static
   * @param {Uint8Array} xorEntropy The original entropy to recover the privateKey from
   * @param {Uint8Array} salt The salt used to tweak the privateKey
   * @returns {Uint8Array} The recovered privateKey
   * @throws {Error} if the privateKey cannot be recovered
   */
  static recoverTweakedRawPrivateKey(xorEntropy: Uint8Array, salt: Uint8Array): Uint8Array {
    // If entropy is not 32 bytes, hash it to get a deterministic 32-byte private key
    if (xorEntropy.length !== 32) {
      xorEntropy = sha256(xorEntropy);
    }
    const entropy = this.XNOR(xorEntropy, salt);
    // Convert entropy to hex
    const hexEntropy = Buffer.from(entropy).toString('hex');
    // Convert hexEntropy to BigInt
    const privateKey = BigInt(`0x${hexEntropy}`);
    // Ensure private key is in valid secp256k1 range1
    if (privateKey < BigInt(1) || privateKey >= CURVE.n) {
      throw new Error('Invalid private key derived from entropy');
    }
    // The valid 32-byte private key
    return entropy;
  }

  /**
   * Recovers a secp256k1 privateKey from its original entropy
   * @static
   * @param {Uint8Array} entropy The entropy to recover the privateKey from
   * @returns {Uint8Array} The recovered privateKey
   * @throws {Error} if the privateKey cannot be recovered
   */
  static recoverRawPrivateKey(entropy: Uint8Array): Uint8Array {
    // If entropy is not 32 bytes, hash it to get a deterministic 32-byte private key
    if (entropy.length !== 32) {
      entropy = sha256(entropy);
    }
    // Convert entropy to hex
    const hexEntropy = Buffer.from(entropy).toString('hex');
    // Convert hexEntropy to BigInt
    const privateKey = BigInt(`0x${hexEntropy}`);
    // Ensure private key is in valid secp256k1 range1
    if (privateKey < BigInt(1) || privateKey >= CURVE.n) {
      throw new Error('Invalid private key derived from entropy');
    }
    // The valid 32-byte private key
    return entropy;
  }

  /**
   * Tweak the entropy with a salt using XOR
   * @static
   * @param {Uint8Array} entropy The entropy to tweak
   * @param {Uint8Array} salt The salt to tweak the entropy with
   * @returns {Uint8Array} The tweaked entropy
   */
  static XOR(entropy: Uint8Array, salt: Uint8Array): Uint8Array {
    const tweaked = new Uint8Array(entropy.length);
    for (let i = 0; i < entropy.length; i++) {
      tweaked[i] = entropy[i] ^ salt[i % salt.length]; // XOR with repeating salt
    }
    return tweaked;
  }

  /**
   * Untweak the entropy with a salt using XNOR
   * @static
   * @param {Uint8Array} tweakedEntropy The tweaked entropy to untweak
   * @param {Uint8Array} salt The salt to untweak the entropy with
   * @returns {Uint8Array} The original entropy
   */
  static XNOR(tweakedEntropy: Uint8Array, salt: Uint8Array): Uint8Array {
    const originalEntropy = new Uint8Array(tweakedEntropy.length);
    for (let i = 0; i < tweakedEntropy.length; i++) {
      originalEntropy[i] = tweakedEntropy[i] ^ salt[i % salt.length]; // XOR with salt again
    }
    return originalEntropy;
  }

  /**
   * Recovers an HDKey from a mnemonic phrase
   * @static @async @method
   * @param {string} mnemonic The mnemonic phrase to recover the HDKey from
   * @param {string} path The path to derive the child key from
   * @returns {Uint8Array} Promise resolving to the recovered private key bytes
   * @throws {Error} if the HDKey cannot be recovered
   */
  static async recoverHdChildFromMnemonic(mnemonic: string, path: string): Promise<Uint8Array> {
    // Generate HDKey from seed.
    const hdkey = await this.recoverHdWallet(mnemonic);
    // Ensure HDKey returns valid
    if (!hdkey) {
      throw new Error('Failed to recover hdkey');
    }
    // Return the privateKey of the derived childKey
    const childPrivKeyBytes = hdkey.derive(path).privateKey;
    if (!childPrivKeyBytes) {
      throw new Error('Failed to recover child private key');
    }
    return childPrivKeyBytes;
  }

  /**
   * Derives a child key from an HDKey
   * @static
   * @param {HDKey} hdkey The HDKey to derive the child key from
   * @param {string} path The path to derive the child key from
   * @returns {HDKey} A Promise resolving to the child key
   * @throws {Error} Error if the child key cannot be derived
   */
  static deriveChildKey(hdkey: HDKey, path: string): HDKey {
    // Derive child key from HDKey.
    const childKey = hdkey.derive(path);
    // Ensure child key returns valid
    if (!childKey) {
      throw new Error(`Failed to derive child key`);
    }
    // Return the child key
    return childKey;
  }

  /**
   * Generates a sh256 hash of the a canonicalized object
   * @static
   * @param {JSONObject} data The data to hash
   * @returns {Uint8Array} The sha256 hash bytes of a canonicalized JSON object
   */
  static hashedCanonical(data: JSONObject): Uint8Array {
    return sha256(Buffer.from(canonicalize(data)));
  }
}