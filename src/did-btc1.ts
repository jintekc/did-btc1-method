import type { DidResolutionResult, DidVerificationMethod } from '@web5/dids';
import {
  Did,
  DidError,
  DidErrorCode,
  DidMethod,
  EMPTY_DID_RESOLUTION_RESULT
} from '@web5/dids';
import { initEccLib, networks } from 'bitcoinjs-lib';
import * as tinysecp from 'tiny-secp256k1';
import { getNetwork } from './bitcoin/network.js';
import { Btc1Create } from './btc1/crud/create.js';
import { Btc1DidDocument } from './btc1/did-document.js';
import { DidCreateParams, DidCreateResponse, DidResolutionOptions, DidUpdateParams } from './btc1/interface.js';
import { Btc1Read } from './btc1/crud/read.js';
import { Btc1Update } from './btc1/crud/update.js';
import { Btc1Utils } from './btc1/utils.js';
import { DidBtc1Error } from './utils/error.js';
import { Btc1Networks, DidBtc1IdTypes } from './btc1/types.js';

export type GetSigningMethodParams = {
  didDocument: Btc1DidDocument;
  methodId?: string;
}

/** initEccLib */
initEccLib(tinysecp);

/**
 * Implements {@link https://dcdpr.github.io/did-btc1 | did:btc1 DID Method Specification}
 * @export
 * @class DidBtc1
 * @type {DidBtc1}
 * @implements {DidMethod}
 */
export class DidBtc1 implements DidMethod {
  /** @type {string} Name of the DID method, as defined in the DID BTC1 specification */
  public static methodName: string = 'btc1';

  /** @type {networks.Network} networks.Network object */
  public static network: networks.Network = networks.bitcoin;

  /**
   * Create a new `did:btc1` identifier from a set of parameters. Implements {@link IDidBtc1.create}
   * @public
   * @static
   * @async
   * @param {DidCreateParams} params Required parameters for the create operation
   * @param {PublicKeyBytes} params.publicKey Public key byte array used to create a btc1 "key" identifier
   * @param {IntermediateDocument} params.intermediateDocument DID Document used to create a btc1 "external" identifier
   * @param {DidCreateParamsOptions} params.options Optional parameters for the create operation
   * @param {string} params.options.idType Type of identifier to create (key or external)
   * @param {string} params.options.version Version number of the btc1 method (1, 2, 3, etc.)
   * @param {string} params.options.network Bitcoin network name (mainnet, testnet, signet, regtest)
   * @returns {Promise<CreateResponse>} Promise resolving to a CreateResponse object
   * @throws {DidBtc1Error} if any of the param checks fail
   */
  public static async create({
    publicKey,
    intermediateDocument,
    options = {}
  }: DidCreateParams): Promise<DidCreateResponse> {
    // Set the default version and network
    options.version ??= '1';
    options.network ??= 'mainnet';

    // Options Check 1: Validate that one of pubKeyBytes or intermediateDocument is not null
    if (!publicKey && !intermediateDocument) {
      throw new DidBtc1Error('Invalid param-option: publicKey or intermediateDocument required');
    }

    // Set default idType based on data passed
    options.idType ??= publicKey ? 'key' : 'external';

    // Deconstruct optional options
    const { idType, version, network } = options;

    // Options Check 2: Validate that the idType is set to either key or external
    if (!(idType in DidBtc1IdTypes)) {
      throw new DidBtc1Error('Invalid param-option: idType required, must be key or external');
    }

    // Options Check 3: Validate pubKeybytes exists if idType = key
    if (!publicKey && idType === 'key') {
      throw new DidBtc1Error('Invalid param-option: publicKey required if idType is key');
    }

    if(publicKey && publicKey?.length !== 33) {
      throw new DidBtc1Error('Invalid param-option: publicKey must be secp256k1 compressed public key (33 bytes)');
    }

    // Options Check 4: Validate intermediateDocument exists if idType = external
    if (!intermediateDocument && idType === 'external') {
      throw new DidBtc1Error('Invalid param-option: intermediateDocument required if idType is external');
    }

    // Options Check 5: Validate network in Btc1Networks if not null
    if (!(network in Btc1Networks)) {
      throw new DidBtc1Error('Invalid param-option: network required, must be mainnet, testnet, signet or regtest');
    }

    // Options Check 6: Validate version as positive number if not null
    if (isNaN(Number(version))) {
      throw new DidBtc1Error('Invalid param-option: version required, must be positive number');
    }

    this.network = getNetwork(options.network);
    publicKey = publicKey!;
    intermediateDocument = intermediateDocument!;

    // If idType is key, call Btc1Create.deterministic; else call Btc1Create.external
    return idType === 'key'
      ? Btc1Create.deterministic({ version, network, publicKey })
      : await Btc1Create.external({ network, version, intermediateDocument });
  }

  /**
   * Entry point for section {@link https://dcdpr.github.io/did-btc1/#read | 4.2 Read} of the did:btc1 specification.
   * Resolves a did:btc1 identifier to its corresponding DID document
   * @public
   * @static
   * @async
   * @param {string} identifier The DID to be resolved
   * @param {DidResolutionOptions} options Optional parameters for the resolution operation
   * @param {Btc1DidDocument} options.sidecarData.initialDocument User-provided, offline DID Document to resolve sidecar
   * @returns {DidResolutionResult} Promise resolving to a DID Resolution Result
   * @throws {Error} if the resolution fails for any reason
   * @throws {DidError} with {@link DidErrorCode.InvalidDid} if the identifier is invalid
   * @example
   * ```ts
   * const resolution = await DidBtc1.resolve('did:btc1:k1q0dygyp3gz969tp46dychzy4q78c2k3js68kvyr0shanzg67jnuez2cfplh')
   * ```
   */
  public static async resolve(identifier: string, options: DidResolutionOptions = {}): Promise<DidResolutionResult> {
    try {
      // Parse the identifier into its components
      const components = Btc1Utils.parse(identifier);
      const { hrp } = components;

      if(!['k', 'x'].includes(hrp)) {
        throw new DidError(DidErrorCode.InvalidDid, 'Invalid DID hrp');
      }

      //  Make sure options.sidecarData is not null if hrp === x
      if (hrp === 'x' && !options.sidecarData) {
        throw new DidError(DidErrorCode.InvalidDid, 'External resolution required for non-deterministic DIDs');
      }

      // Resolve the DID Document based on the hrp
      const initialDocument = hrp === 'k'
        ? Btc1Read.deterministic({ identifier, components })
        : await Btc1Read.external({ identifier, components, options });

      // Set the default resolution result
      const didResolutionResult: DidResolutionResult = {
        '@context'            : 'https://w3id.org/did-resolution/v1',
        didResolutionMetadata : {},
        didDocumentMetadata   : {},
        didDocument           : {} as Btc1DidDocument
      };

      didResolutionResult.didDocument = await Btc1Read.targetDocument({ initialDocument, options });
      // Return the resolved DID Document
      return didResolutionResult;
    } catch (error: any) {
      console.error(error);
      // Rethrow any unexpected errors that are not a `DidError`.
      if (!(error instanceof DidError)) throw new Error(error);

      // Return a DID Resolution Result with the appropriate error code.
      return {
        ...EMPTY_DID_RESOLUTION_RESULT,
        didResolutionMetadata : {
          error : error.code,
          ...error.message && { errorMessage: error.message }
        }
      };
    }
  }

  /**
   * Entry point for section {@link https://dcdpr.github.io/did-btc1/#read | 4.3 Update} of the did:btc1 specification.
   * Update a `did: btc1` DID Document using a JSON patch and announces the update using beacon signals.
   * @static
   * @async
   * @param {DidUpdateParams} params Required parameters for the update operation
   * @param {string} params.identifier The DID to be updated
   * @param {Btc1DidDocument} params.sourceDocument The source document to be updated
   * @param {string} params.sourceVersionId The versionId of the source document
   * @param {Btc1DocumentPatch} params.documentPatch The JSON patch to be applied to the source document
   * @param {string} params.verificationMethodId The verificationMethod ID to sign the update
   * @param {string[]} params.beaconIds The beacon IDs to announce the update
   * @param {ProofOptions} params.options Optional parameters for the update operation
   * @returns {Promise<void>} Promise resolving to void
   * @throws {DidError} with {@link DidErrorCode.InvalidDidDocument} if the publicKeyMultibase is malformed or the
   * verificationMethod type is not Multikey
   */
  static async update({
    identifier,
    sourceDocument,
    sourceVersionId,
    documentPatch,
    verificationMethodId,
    beaconIds,
    options
  }: DidUpdateParams): Promise<void> {
    // Construct an unsigned update payload
    const updatePayload = await Btc1Update.constructPayload({
      identifier,
      documentPatch,
      sourceDocument,
      sourceVersionId,
    });
    const didDocument = sourceDocument;
    // Get the sourceDocument verificationMethods and filter for the verificationMethodId passed
    const verificationMethod = Btc1Utils.getVerificationMethods({ didDocument }).filter(
      vm => vm.id === verificationMethodId
    )?.[0];
    // Validate the verificationMethod type is Multikey
    if (verificationMethod.type !== 'Multikey') {
      throw new DidError(DidErrorCode.InvalidDidDocument, 'Verification method must be type Multikey');
    }
    // Validate the first 4 chars as z66P of the verificationMethod publicKeyMultibase
    if (verificationMethod.publicKeyMultibase?.slice(0, 4) !== 'z66P') {
      throw new DidError(DidErrorCode.InvalidDidDocument, 'Malformed verification method publicKeyMultibase');
    }
    const didUpdateInvocation = Btc1Update.invokePayload({ identifier, updatePayload, verificationMethod, options });
    return Btc1Update.announcePayload({ sourceDocument, beaconIds, didUpdateInvocation });
  }

  /**
   * @static
   * @async
   Given the W3C DID Document of a `did:btc1` identifier, return the signing verification method that will be used
   for signing messages and credentials. If given, the `methodId` parameter is used to select the
   verification method. If not given, the Identity Key's verification method with an ID fragment
   of '#initialKey' is used. signing method used

   * @param {GetSigningMethodParams} params The parameters for the `getSigningMethod` operation
   * @param {DidDocument} params.didDocument DID Document to get the verification method from
   * @param {string} params.methodId Optional ID of the verification method to use for signing
   * @returns {DidVerificationMethod} Promise resolving to the verification method used for signing
   * @throws {DidError} with {@link DidErrorCode.InternalError} if an error occurs during getSigningMethod
   * or with {@link DidErrorCode.MethodNotSupported} if signing method could not be determined
   */
  static async getSigningMethod({ didDocument, methodId }: GetSigningMethodParams): Promise<DidVerificationMethod> {
    methodId ??= '#initialKey';
    // Verify the DID method is supported.
    const parsedDid = Did.parse(didDocument.id);
    if (parsedDid && parsedDid.method !== this.methodName) {
      throw new DidError(DidErrorCode.MethodNotSupported, `Method not supported: ${parsedDid.method} `);
    }
    // Attempt to find a verification method that matches the given method ID, or if not given,
    // find the first verification method intended for signing claims.
    const verificationMethod = didDocument.verificationMethod?.find(
      (vm: DidVerificationMethod) => Btc1Utils.extractDidFragment(vm.id) === (Btc1Utils.extractDidFragment(methodId)
        ?? Btc1Utils.extractDidFragment(didDocument.assertionMethod?.[0]))
    );
    if (!(verificationMethod && verificationMethod.publicKeyMultibase)) {
      throw new DidError(
        DidErrorCode.InternalError,
        'A verification method intended for signing could not be determined from the DID Document'
      );
    }
    return verificationMethod;
  }
}