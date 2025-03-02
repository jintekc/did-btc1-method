import type { DidService } from '@web5/dids';
import { DidError, DidErrorCode } from '@web5/dids';
import { base58btc } from 'multiformats/bases/base58';
import Bitcoind from '../../bitcoin/rpc-client.js';
import { DidBtc1Error } from '../../utils/error.js';
import { GeneralUtils } from '../../utils/general.js';
import JsonPatch from '../../utils/json-patch.js';
import { Btc1DidDocument } from '../did-document.js';
import { Btc1RootCapability, ConstructPayloadParams, UpdatePayload } from '../interface.js';
import { BroadcastPayloadParams, InvokePayloadParams } from '../types.js';
import { SignedRawTx } from '../../bitcoin/types.js';

/**
 * Implements did-btc1 spec section {@link https://dcdpr.github.io/did-btc1/#update | 4.3 Update} of the CRUD sections
 * for updating `did:btc1` dids and did documents.
 * @export
 * @class Btc1Update
 * @type {Btc1Update}
 */
export class Btc1Update {
  /**
   *
   * Constructs an UpdatePayload object from a given sourceDocument, sourceVersionId, and documentPatch.
   * {@link https://dcdpr.github.io/did-btc1/#construct-did-update-payload | 4.3.1 Construct DID Update Payload}
   *
   * @static
   * @param {ConstructPayloadParams} params Required params for calling the constructPayload method
   * @param {string} params.identifier The did-btc1 identifier to derive the root capability from.
   * @param {Btc1DidDocument} params.sourceDocument The source document to be updated.
   * @param {string} params.sourceVersionId The versionId of the source document.
   * @param {DidDocumentPatch} params.documentPatch The JSON patch to be applied to the source document.
   * @returns {Promise<UpdatePayload>} The constructed UpdatePayload object.
   * @throws {DidError} with {@link DidErrorCode.InvalidDid} if sourceDocument.id does not match identifier.
   */
  public static async constructPayload({
    identifier,
    sourceDocument,
    sourceVersionId,
    documentPatch,
  }: ConstructPayloadParams): Promise<UpdatePayload> {
    // Validate the sourceDocument id matches the identifier
    if (sourceDocument.id !== identifier) {
      throw new DidError(DidErrorCode.InvalidDid, 'Source document id does not match identifier');
    }
    const sourceDocHash = await GeneralUtils.sha256Canonicalize(sourceDocument);
    // Set updatePayload object
    const updatePayload: UpdatePayload = {
      '@context' : [
        'https://w3id.org/zcap/v1',
        'https://w3id.org/security/data-integrity/v2',
        'https://w3id.org/json-ld-patch/v1',
        'https://github.com/dcdpr/did-btc1'
      ],
      patch           : documentPatch,
      targetHash      : '',
      targetVersionId : `${Number(sourceVersionId) + 1}`,
      sourceHash      : base58btc.encode(sourceDocHash),
    };
    // Apply patch to source document
    const targetDocument = JsonPatch.apply(sourceDocument, documentPatch);
    // Validate the targetDocument conforms to DID document spec
    const { valid, errors } = Btc1DidDocument.validate(targetDocument);
    // If targetDocument is invalid, throw an error
    if (!valid && errors?.length) {
      throw new DidError(DidErrorCode.InvalidDidDocument, `Invalid target document: ${errors.join(', ')}')}`);
    }
    const targetDocHash = await GeneralUtils.sha256Canonicalize(targetDocument);
    // Set the targetHash in the UpdatePayload
    updatePayload.targetHash = base58btc.encode(targetDocHash);
    return updatePayload;
  }

  /**
   *
   * Function retrieves privateKeyBytes for verificationMethod and adds capability invocation, Data Integrity proof
   * following the Authorization Capabilities (ZCAP-LD) and VC Data Integrity specifications.
   * {@link https://dcdpr.github.io/did-btc1/#invoke-did-update-payload | 4.3.1 Construct DID Update Payload}
   *
   * @static
   * @param {InvokePayloadParams} params Required params for calling the invokePayload method
   * @param {string} params.identifier The did-btc1 identifier to derive the root capability from
   * @param {DidUpdatePayload} params.updatePayload The updatePayload object to be signed
   * @param {DidVerificationMethod} params.verificationMethod The verificationMethod object to be used for signing
   * @param {RecoveryOptions} params.options The options object containing seed, entropy, mnemonic, and path
   * @returns {ProofOptions} Object containing the proof options
   * @throws {DidBtc1Error} if the privateKeyBytes are invalid
   */
  static invokePayload({
    identifier,
    verificationMethod,
    options: {
      seed,
      entropy,
      hd: { mnemonic, path },
    } }: InvokePayloadParams): any {
    // Derive privateKeyBytes from mnemonic & path, seed, or entropy, salt
    let privateKeyBytes = mnemonic && path
      ? GeneralUtils.recoverHdChildFromMnemonic(mnemonic, path)
      : seed
        ? GeneralUtils.recoverHdWallet(seed)
        : entropy
          ? GeneralUtils.recoverRawPrivateKey(entropy)
          : null;
    // Validate privateKeyBytes
    if (!privateKeyBytes) {
      throw new DidBtc1Error('Invalid privateKeyBytes');
    }
    // Derive the root capability from the identifier
    const rootCapability = this.deriveRootCapability(identifier);
    // Construct the proof options
    const proofOptions = {
      type               : 'DataIntegrityProof',
      cryptosuite        : 'bip340-jcs-2025',
      verificationMethod : verificationMethod.id as any,
      proofPurpose       : 'capabilityInvocation',
      capability         : rootCapability.id,
      capabilityAction   : 'Write',
    };
    console.log('proofOptions:', proofOptions);
    return proofOptions;
  }

  /**
   * @static
   * @name deriveRootCapability
   * @description Derive a root capability from a given did-btc1 identifier
   * @param {string} identifier The did-btc1 identifier to derive the root capability from
   * @returns {Btc1RootCapability} The root capability object
   * @see {@link https://dcdpr.github.io/did-btc1/#root-didbtc1-update-capabilities}
   */
  static deriveRootCapability(identifier: string): Btc1RootCapability {
    return {
      '@context'       : 'https://w3id.org/zcap/v1',
      id               : `urn:zcap:root:${encodeURIComponent(identifier)}`,
      controller       : identifier,
      invocationTarget : identifier,
    };
  }

  /**
   * @static
   * @description Retrieves beaconServices from sourceDocument and Broadcasts DID Update Payload for each beacon
   * @param {AnnounceUpdatePayloadParams} params Required params for calling the announcePayload method
   * @param {} params.sourceDocument The did-btc1 did document to derive the root capability from
   * @param {} params.beaconIds The didUpdatePayload object to be signed
   * @param {} params.didUpdateInvocation The verificationMethod object to be used for signing
   * @returns {} Array of signalMetadata objects with necessary data to validate Beacon Signal against Did Update
   * @throws {DidError} if the beaconService type is invalid
   */
  static announcePayload({ sourceDocument, beaconIds, didUpdateInvocation }: any): any {
    const beaconServices = [];
    const signalMetadata = [];
    // Find the beacon services in the sourceDocument
    for (const beaconId of beaconIds) {
      const beaconService = sourceDocument.service.find((s: DidService) => s.id === beaconId);
      if (!beaconService) {
        throw new DidError(DidErrorCode.InvalidDidDocument, `Beacon not found: ${beaconId}`);
      }
      beaconServices.push(beaconService);
    }
    // Broadcast the didUpdatePayload to each beaconService
    for (const beaconService of beaconServices) {
      if (beaconService.type === 'SingletonBeacon') {
        signalMetadata.push(
          this.broadcastUpdateAttestation({
            beaconService,
            didUpdateInvocation,
            options : { bitcoind: Bitcoind.connect() }
          })
        );
      } else if (beaconService.type === 'SMTAggregatorBeacon') {
        // TODO: implement CIDAggregatorBeacon broadcast did update payload fn
        // TODO: classes for each beacon type that can also do the signing and broadcasting
        // TODO:
        throw new Error('SMTAggregatorBeacon not yet implemented');
      } else if (beaconService.type === 'CIDAggregatorBeacon') {
        // TODO: implement CIDAggregatorBeacon broadcast did update payload fn
        throw new Error('CIDAggregatorBeacon not yet implemented');
      } else {
        throw new DidError(DidErrorCode.InvalidDidDocument, `Invalid beacon type: ${beaconService.type}`);
      }
    }
    // Return the signalMetadata
    return signalMetadata;
  }

  /**
   * TODO: Needs rewriting in spec
   * @static @async @method
   * @name broadcastUpdateAttestation
   * @description Constructs bitcoin trasaction to broadcast didUpdatePayload to a SingletonBeacon service
   * @param {BroadcastPayloadParams} params Required parameters for broadcasting a did update attestation
   * @param {BeaconService} params.beaconService The beacon service to broadcast the did update attestation for
   * @param {DidVerificationMethod} params.didUpdateInvocation The verificationMethod object to be used for signing
   * @returns {SignedRawTx} Successful output of a bitcoin transaction
   * @throws {DidError} if an error occurs while broadcasting the did update attestation
   * @throws {DidErrorCode.InvalidDidDocument} if the bitcoin address is invalid or not funded
   */
  static async broadcastUpdateAttestation({
    beaconService,
    didUpdateInvocation,
    options
  }: BroadcastPayloadParams): Promise<SignedRawTx> {
    // Connect to the default bitcoind node
    const bitcoind: Bitcoind = options.bitcoind ?? Bitcoind.connect();
    // Decode the beaconService serviceEndpoint
    console.log('didUpdateInvocation', didUpdateInvocation);
    const addressUri = beaconService.serviceEndpoint;
    // Decode the addressUri to a bitcoin address
    const bitcoinAddress = base58btc.decode(addressUri);
    // Validate the bitcoin address
    if (!bitcoinAddress) {
      throw new DidError(DidErrorCode.InvalidDidDocument, `Invalid bitcoin address: ${addressUri}`);
    }
    // TODO: check if bitcoinAddress is funded; if not, fund it
    // Construct a raw transaction
    const hexstring = await bitcoind.createRawTransaction({
      inputs     : [{ txid: '', vout: 0 }],
      outputs    : { address: addressUri, data: '' },
      locktime   : 0,
      replacable : false
    });
    // Sign the raw transaction
    const signedRawTx = await bitcoind.signRawTransaction({ hexstring });
    // Broadcast the signed raw transaction
    await bitcoind.sendRawTransaction(signedRawTx.hex, true);
    // Return the signed raw transaction
    return signedRawTx;
  }
}