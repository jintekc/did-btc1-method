import { HashBytes, KeyPair, KeyPairUtils, Logger, MultibaseKeyPair } from '@did-btc1/bip340-cryptosuite';
import { sha256 } from '@noble/hashes/sha256';
import { KeyValueStore, MemoryStore } from '@web5/common';
import { KeyIdentifier } from '@web5/crypto';
import { Btc1KeyManagerOptions, KeyManagerParams, MULTIBASE_URI_PREFIX } from '../../index.js';
import { Btc1KeyManagerError } from '../../utils/error.js';
import { KeyManager } from './interface.js';

/**
 * A class for managing cryptographic keys for the Btc1 DID method.
 * @export
 * @class Btc1KeyManager
 * @type {Btc1KeyManager}
 * @implements {KeyManager}
 */
export class Btc1KeyManager implements KeyManager {
  public activeKeyUri: KeyIdentifier;

  /**
   * The `_keyStore` private variable in `Btc1KeyManager` is a `KeyValueStore` instance used for
   * storing and managing cryptographic keys. It allows the `Btc1KeyManager` class to save,
   * retrieve, and handle keys efficiently within the local Key Management System (KMS) context.
   * This variable can be configured to use different storage backends, like in-memory storage or
   * persistent storage, providing flexibility in key management according to the application's
   * requirements.
   */
  private _keyStore: KeyValueStore<KeyIdentifier, MultibaseKeyPair>;

  /**
   * Creates an instance of Btc1KeyManager.
   * @constructor
   * @param {?KeyManagerParams} params The parameters to initialize the key manager.
   * @param {KeyValueStore<KeyIdentifier, MultibaseKeyPair>} params.keyStore An optional property
   * to specify a custom `KeyValueStore` instance for key management. If not provided,
   * {@link Btc1KeyManager | `Btc1KeyManager`} uses a default `MemoryStore` instance. This store is
   * responsible for managing cryptographic keys, allowing them to be retrieved, stored, and managed
   * during cryptographic operations.
   */
  constructor(params?: KeyManagerParams) {
    this._keyStore = params?.keyStore ?? new MemoryStore<KeyIdentifier, MultibaseKeyPair>();
    this.activeKeyUri = params?.keyUri ?? '';
  }


  /**
   * TODO: Complete method.
   * Gets the active key URI.
   *
   * @public
   * @async
   * @param {KeyIdentifier} keyUri The URI of the key to get the public key for.
   * @returns {Promise<object>}
  public async getPublicKey(keyUri?: KeyIdentifier): Promise<object> {
    // Use the active key URI if not provided
    keyUri ??= this.activeKeyUri;

    // Throw an error if no key URI is provided or active
    if (!keyUri) {
      throw new Btc1KeyManagerError('No key URI provided or active.', 'KEY_URI_NOT_FOUND');
    }

    // Get the key pair from the key store
    const keyPair = await this._keyStore.get(keyUri);

    // Throw an error if the key is not found
    if (!keyPair) {
      throw new Btc1KeyManagerError(`Key not found for Multibase URI: ${keyUri}`, 'KEY_NOT_FOUND');
    }

    // Return the public key
    return keyPair.publicKey;
  }*/


  /**
   * TODO: Complete methods
   * Converts the KeyPair to a Multikey.
   * @public
   * @async
   * @param {KeyIdentifier} keyUri
   * @returns {Promise<MultibaseKeyPair>}
  public async getMultikey(keyUri: KeyIdentifier): Promise<MultibaseKeyPair> {
    const multikeyPair = await this.exportKey(keyUri) as KeyPair;
    const keyPair = new KeyPair(multikeyPair) as KeyPair;
    const multikey = new Multikey({ id, controller, keyPair });
  }

  public sign(keyUri: KeyIdentifier, data: Hex): SignatureBytes {
    throw new Error('Method not implemented.');
  }

  public verify(keyUri: KeyIdentifier, signature: SignatureBytes, data: Hex): Promise<boolean> {
    throw new Error('Method not implemented.');
  }*/

  /**
   * Exports the full key pair from the key store.
   * @public
   * @async
   * @param {KeyIdentifier} keyUri The URI of the key to export.
   * @returns {Promise<MultibaseKeyPair>} The key pair associated with the key URI.
   * @throws {Btc1KeyManagerError} If the key is not found in the key store.
   */
  public async exportKey(keyUri: KeyIdentifier): Promise<MultibaseKeyPair> {
    const keyPair = await this._keyStore.get(keyUri);
    if (!keyPair) {
      throw new Btc1KeyManagerError(`Key not found for Multibase URI: ${keyUri}`, 'KEY_NOT_FOUND');
    }

    return keyPair;
  }


  /**
   * Imports a keypair into the key store.
   * See {@link IBtc1KeyManager.importKey | IBtc1KeyManager} for more details.
   * @public
   * @async
   * @param {KeyPair} keyPair The keypair to import.
   * @param {Btc1KeyManagerOptions} options The options to import the keypair.
   * @param {boolean} options.active A flag to set the key as active (optional, default: false).
   * @returns {Promise<KeyIdentifier>} The URI of the imported keypair.
   */
  public async importKey(keyPair: KeyPair, { active }: Btc1KeyManagerOptions = {}): Promise<KeyIdentifier> {
    // Compute the key URI if not provided
    const keyUri = this.computeKeyUri(keyPair);

    // Store the keypair in the key store
    const multibaseKey = keyPair.multibase();

    // Store the keypair in the key store
    await this._keyStore.set(keyUri, multibaseKey);

    // Set the key as active if required
    if(active) {
      this.activeKeyUri = keyUri;
    }

    // Return the key URI
    return keyUri;
  }


  /**
   * Computes the hash of the given data.
   * See {@link IBtc1KeyManager.digest | IBtc1KeyManager} for more details.
   * @public
   * @param {Uint8Array} data The data to hash.
   * @returns {HashBytes} The hash of the data.
   */
  public digest(data: Uint8Array): HashBytes {
    return sha256(data);
  }

  /**
   * Computes the key URI of a given keypair.
   * See {@link IBtc1KeyManager.computeKeyUri | IBtc1KeyManager} for more details.
   * @public
   * @param {KeyPair} keyPair The keypair to compute the URI for/
   * @returns {KeyIdentifier} The URI of the keypair/
   */
  public computeKeyUri(keyPair: KeyPair): KeyIdentifier {
    // Concat the URI prefix to the publicKeyMultibase
    return `${MULTIBASE_URI_PREFIX}${keyPair.publicKey.multibase}`;
  }

  /**
   * Generates a new keypair and stores it in the key store.
   * See {@link IBtc1KeyManager.generateKey | IBtc1KeyManager} for more details.
   * @public
   * @async
   * @param {Btc1KeyManagerOptions} options The options to generate the keypair (optional, default: true).
   * @param {boolean} options.importKey A flag to import the keypair into the key store (optional, default: false).
   * @param {boolean} options.active A flag to set the key as active.
   * @returns {KeyIdentifier} The URI of the generated keypair.
   */
  public async generateKey({ importKey, active }: Btc1KeyManagerOptions = {}): Promise<KeyIdentifier | KeyPair> {
    // Set default values for the options
    importKey ??= true;
    active ??= false;

    // Generate a new keypair
    const keyPair = KeyPairUtils.generate();

    // If "importKey" is true, import the key and return the key URI
    if(importKey) {
      return await this.importKey(keyPair, { active });
    }

    // Return the key URI
    return keyPair;
  }

  /**
   * Statically initialize a new Btc1KeyManager class instance.
   * @public
   * @static
   * @async
   * @param {KeyPair} keyPair The keypair used to initialize the key manager (optional).
   * @returns {Btc1KeyManager} A new Btc1KeyManager instance.
   */
  public static async initialize(keyPair?: KeyPair): Promise<Btc1KeyManager> {
    // Check if the keypair is provided
    if(!keyPair) {
      // Log a warning message if not provided
      Logger.warn('KeyPair not provided. Generating a new keypair ...');
    }

    // Generate a new keypair if not provided
    keyPair ??= KeyPairUtils.generate();

    // Initialize the key manager with the keypair
    const keyManager = new Btc1KeyManager();

    // Import the keypair into the key store
    const keyUri = await keyManager.importKey(keyPair);

    // Set the active key URI
    keyManager.activeKeyUri = keyUri;

    // Log the active key URI
    Logger.info(`KeyManager initialized with Active Key URI: ${keyManager.activeKeyUri}`);

    // Return the key manager instance
    return keyManager;
  }
}