import { PublicKey } from '@did-btc1/bip340-cryptosuite';
import { strings } from '@helia/strings';
import { sha256 } from '@noble/hashes/sha256';
import { canonicalize } from '@web5/crypto';
import type { DidVerificationMethod } from '@web5/dids';
import { DidError, DidErrorCode } from '@web5/dids';
import { createHelia } from 'helia';
import { CID } from 'multiformats/cid';
import * as Digest from 'multiformats/hashes/digest';
import BitcoinClient from '../bitcoin/client.js';
import { DEFAULT_BLOCK_CONFIRMATIONS } from '../constants/bitcoin.js';
import { ID_PLACEHOLDER_VALUE } from '../constants/btc1.js';
import { TargetBlockHeight } from '../types/bitcoind.js';
import {
  Btc1DidDocument,
  BtcNetworks,
  ReadCas,
  ReadDeterministic,
  ReadExternal,
  ReadSidecar,
  TargetDocumentParams,
  TraverseBlockchainParams,
  UnixTimestamp,
} from '../types/btc1.js';
import { DidBtc1Error } from '../utils/errors.js';
import { GeneralUtils } from '../utils/general.js';
import { Btc1Utils } from './utils.js';

/**
 * Implements {@link https://dcdpr.github.io/did-btc1/#read} section of the did-btc1 spec for resolving `did:btc1` identifiers and documents
 * @export
 * @class Btc1Read
 * @type {Btc1Read}
 */
export class Btc1Read {
  /**
   * Recreates the `did:btc1` Document deterministically using the params
   * @static
   * @name deterministic
   * @param {ReadDeterministic} params Required params for calling the deterministic method
   * @param {string} params.version The did-btc1 version
   * @param {string} params.network The name of the bitcoin network (mainnet, testnet, regtest)
   * @param {Uint8Array} params.publicKey The public key bytes used for the identifier
   * @returns {Btc1DidDocument} The resolved DID Document object
   */
  static deterministic({ identifier, identifierComponents }: ReadDeterministic): Btc1DidDocument {
    // Deconstruct the identifierComponents
    const { network: networkName, genesisBytes } = identifierComponents;
    // Construct a new PublicKey
    const publicKey = new PublicKey(genesisBytes);
    // Get the network object from the network name
    const network = BtcNetworks.get(networkName);
    // Encode the public key as a mult
    const publicKeyMultibase = publicKey.encode();
    // Generate the beacon services from the network and public key
    const service = Btc1Utils.generateBeaconServices({ network, publicKey: publicKey.x });
    // Return the resolved DID Document object
    return {
      '@context' : [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/multikey/v1',
        'https://github.com/dcdpr/did-btc1'
      ],
      id                   : identifier,
      authentication       : ['#initialKey'],
      assertionMethod      : ['#initialKey'],
      capabilityInvocation : ['#initialKey'],
      capabilityDelegation : ['#initialKey'],
      verificationMethod   : [{
        id                 : '#initialKey',
        type               : 'Multikey',
        controller         : identifier,
        publicKeyMultibase
      }],
      service
    };
  }

  /**
   * Resolves the `did:btc1` Document externally (sidecar or cas) using the params
   * @static
   * @async
   * @name external
   * @param {ReadExternal} params Required params for calling the external method
   * @param {string} params.identifier The DID to be resolved
   * @param {Btc1IdentifierComponents} params.identifierComponents The components of the identifier
   * @param {DidResolutionOptions} params.options The options for resolving the DID Document
   * @param {Btc1DidDocument} params.options.sidecarData.initialDocument The offline user-provided DID Document
   * @returns {Btc1DidDocument} The resolved DID Document object
   */
  static async external({ identifier, identifierComponents, options }: ReadExternal): Promise<Btc1DidDocument> {
    const { initialDocument } = options.sidecarData;
    return !initialDocument
      ? await this.cas({ identifier, identifierComponents })
      : this.sidecar({ identifier, identifierComponents, initialDocument });
  }

  /**
   * Validates a `did:btc1` identifier using sidecar data
   * @static
   * @name sidecar
   * @param {ReadSidecar} params Required params for calling the sidecar method
   * @param {string} params.identifier The DID to be resolved
   * @param {Btc1IdentifierComponents} params.identifierComponents The components of the DID identifier
   * @param {Btc1DidDocument} params.initialDocument The initial DID Document provided by the user
   * @returns {Btc1DidDocument} The resolved DID Document object
   * @throws {DidError} with {@link DidErrorCode.InvalidDidDocument} if genesisBytes !== initialDocument hashBytes
   */
  static sidecar({ identifierComponents, initialDocument }: ReadSidecar): Btc1DidDocument {
    // Set intermediateDocument to a copy of initialDocument
    const intermediateDocument = initialDocument;

    /** Set the document.id to {@link ID_PLACEHOLDER_VALUE} */
    intermediateDocument.id = ID_PLACEHOLDER_VALUE;

    /** Set the document.verificationMethod[i].controller to {@link ID_PLACEHOLDER_VALUE} */
    intermediateDocument.verificationMethod =
          Btc1Utils.getVerificationMethods({ didDocument: intermediateDocument })
            .map((vm: DidVerificationMethod) => ({ ...vm, controller: intermediateDocument.id }));

    // Sha256 hash the canonicalized byte array of the intermediateDocument
    const hashBytes = sha256(Buffer.from(canonicalize(intermediateDocument)));

    // Validate the genesisBytes match the hashBytes
    if (identifierComponents.genesisBytes !== hashBytes) {
      throw new DidError(DidErrorCode.InvalidDidDocument, 'Genesis bytes do not match hash bytes of initial document');
    }
    return initialDocument;
  }

  /**
   * @static
   *  Resolves DID Document in Content Addressable Storage (CAS) using `did:btc1` identifier and components
   * @async
   * @name cas
   * @param {ReadCas} params Required params for calling the cas method
   * @param {string} params.identifier BTC1 DID used to resolve the DID Document
   * @param {Btc1IdentifierComponents} params.identifierComponents BTC1 DID components used to resolve the DID Document
   * @returns {Btc1DidDocument} The resolved DID Document object
   * @throws {DidError} if an error occurs while resolving from CAS
   * @throws {DidErrorCode.InvalidDidDocument} if the DID Document content is invalid
   */
  static async cas({ identifier, identifierComponents }: ReadCas): Promise<Btc1DidDocument> {
    // Set hashBytes to genesisBytes
    const hashBytes = identifierComponents.genesisBytes;
    // Create a CID from the hashBytes
    const cid = CID.create(1, 1, Digest.create(1, hashBytes));
    // Create a Helia node connection to IPFS
    const helia = strings(await createHelia());
    // Get the intermediateDocument from the Helia node
    const intermediateDocument = await helia.get(cid, {});
    // Validate the intermediateDocument is parsable JSON
    if (!JSON.parsable(intermediateDocument)) {
      throw new DidError(DidErrorCode.InvalidDidDocument, 'Invalid DID Document content');
    }
    // Parse the intermediateDocument into a Btc1DidDocument object
    const initialDocument = JSON.parse(intermediateDocument) as Btc1DidDocument;
    // Set the initialDocument id and verification method controller to the identifier
    initialDocument.id = identifier;
    initialDocument.verificationMethod =
          Btc1Utils.getVerificationMethods({ didDocument: initialDocument })
            .map((vm: DidVerificationMethod) => ({ ...vm, controller: initialDocument.id }));
    // Return the resolved initialDocument
    return initialDocument;
  }

  /**
   * @static
   *  Resolves a DID Document at a specific versionId and blockheight
   * @async
   * @name targetDoc
   * @param {TargetDocumentParams} params Required parameters for resolving the target DID Document
   * @param {Btc1DidDocument} params.initialDocument The initial DID Document to resolve
   * @param {ResolutionOptions} params.options The options for resolving the DID Document
   * @returns {Btc1DidDocument} The resolved DID Document object with a validated single, canonical history
   */
  static async targetDocument({ initialDocument, options }: TargetDocumentParams): Promise<Btc1DidDocument> {
    // If options.versionId is not null, set targetVersionId to options.versionId
    const targetVersionId = options.versionId;

    // If options.versionTime is not null, set targetTime to options.versionTime
    const targetTime = options.versionTime;

    // Set the targetBlockheight to the result of passing targetTime to the algorithm Determine Target Blockheight
    const targetBlockheight = await this.determineTargetBlockheight(targetTime, options.bitcoinClient);

    // Set sidecarData to options.sidrcarData
    const sidecarData = options.sidecarData;

    // Set currentVersionId to 1
    const currentVersionId = 1;

    // If the targetVersionId equals currentVersionId, return initialDocument
    if(targetVersionId === currentVersionId) {
      return initialDocument;
    }

    // Set updateHashHistory to an empty array
    const updateHashHistory = new Array();

    // Set contemporaryBlockheight to 1
    const contemporaryBlockheight = 1;

    // Set contemporaryDidDocument to initialDocument
    const contemporaryDidDocument = initialDocument;

    // Set targetDocument to the result of passing contemporaryDIDDocument, contemporaryBlockheight,
    // currentVersionId, targetVersionId, targetBlockheight, updateHashHistory, and sidecarData
    // to the Traverse Blockchain History algorithm.
    const targetDocument = this.traverseBlochchainHistory({
      targetBlockheight,
      currentVersionId,
      targetVersionId,
      updateHashHistory,
      contemporaryBlockheight,
      sidecarData,
      contemporaryDidDocument,
    });

    // Return targetDocument
    return targetDocument;
  }

  /**
   * @static
   *  Determines the target blockheight given an optional targetTime or default confirmations
   * @async
   * @name determineTargetBlockheight
   * @param {UnixTimestamp} targetTime Optional unix timestamp used to find highest blockheight < targetTime
   * If not provided, finds the highest bitcoin blockheight where confirmations > {@link DEFAULT_BLOCK_CONFIRMATIONS}
   * @param {BitcoinClient} bitcoinClient Optional bitcoind client instance used to connect to a bitcoin node
   * If not provided, connects to the default bitcoind node
   * If IS_TEST is also true, connects to a Polar regtest node
   * @returns {number} The target blockheight (number)
   * @throws {DidBtc1Error} if there is a block height mismatch
   */
  static async determineTargetBlockheight(targetTime?: UnixTimestamp, bitcoinClient?: BitcoinClient): Promise<number> {
    // If bitcoinClient is not defined, connect to default bitcoin node
    bitcoinClient ??= BitcoinClient.connect();
    // Get the current block height
    const height = await bitcoinClient.getBlockCount();
    // Get the current blockchain info blocks count
    const { blocks } = await bitcoinClient.getBlockchainInfo();
    // Gut check: If height is not equal to blocks, throw an error
    if (height !== blocks) {
      throw new DidBtc1Error(`Block height mismatch! ${height} !== ${blocks}`);
    }
    // Get the block hash at the current height
    const hash = await bitcoinClient.getBlockHash(height);
    // Get the block at the current height
    const block = await bitcoinClient.getBlock(hash);
    // Return block height response from getTargetBlockHeight
    return await this.getTargetBlockHeight({ block, bitcoinClient, targetTime });
  }

  /**
   * @static
   *  Determines the target blockheight given an optional targetTime or default confirmations
   * @async
   * @name getTargetBlockHeight
   * @param {TargetBlockHeight} params Required parameters for determining the target blockheight
   * @param {BitcoinBlock} params.block Starting bitcoin block
   * @param {BitcoinClient} params.bitcoinClient Optional client connection to a bitcoind node (required in production)
   * @param {UnixTimestamp} params.targetTime to find the largest block with timestamp < targetTime
   * @returns {number} Promise resolving to the target blockheight
   */
  static async getTargetBlockHeight({block, bitcoinClient, targetTime}: TargetBlockHeight): Promise<number> {
    if(!targetTime) {
      // Traverse Bitcoin blocks to find the largest block with confirmations >= DEFAULT_BLOCK_CONFIRMATIONS
      while (block.confirmations <= DEFAULT_BLOCK_CONFIRMATIONS) {
        block.hash = await bitcoinClient.getBlockHash(--block.height);
        block = await bitcoinClient.getBlock(block.hash);
      }
      // Return the block height
      return block.height;
    }
    // Traverse Bitcoin blocks to find the largest block with timestamp < targetTime
    while (block.time > targetTime) {
      block.hash = await bitcoinClient.getBlockHash(--block.height);
      block = await bitcoinClient.getBlock(block.hash);
    }
    // Return the block height
    return block.height;
  }


  /**
   *
   * Takes as inputs a Bitcoin blockheight specified by contemporaryBlockheight and an array of beacons and returns a
   * nextSignals object, containing a blockheight the signals were found in and an array of signals. Each signal is an
   * object containing beaconId, beaconType, and tx properties.
   * {@link https://dcdpr.github.io/did-btc1/#find-next-signals | 4.2.3.3 Find Next Signals}
   *
   * @static
   * @async
   * @param {{ blockheight: number, beacons: any[] }} param0
   * @param {number} param0.blockheight
   * @param {{}} param0.beacons
   */
  static async findNextSignals({ blockheight, beacons }: { blockheight: number, beacons: any[] }){

    const bitcoin = BitcoinClient.connect();
    const block = await bitcoin.getBlock(`${blockheight}`);
    const beaconSignals = [];
    for (const tx of block.tx){
      const raw = await bitcoin.getRawTransaction(tx, 1);
      for (const vout of raw.vout){
        for (const beacon of beacons){
          if (vout.scriptPubKey.address === beacon.address){
            beaconSignals.push({ beaconId: beacon.id, beaconType: beacon.type, tx });
          }
        }
      }
    }
    return beaconSignals;
  }

  /**
   *
   * {@link 4.2.3.2 Traverse Blockchain History | https://dcdpr.github.io/did-btc1/#traverse-blockchain-history}
   *
   * The Traverse Blockchain History algorithm iterates over Bitcoin blocks, starting from the block with the,
   * contemporaryBlockheight to find beaconSignals emitted by Beacons within the contemporaryDIDDocument. Each
   * beaconSignal is processed to retrieve a didUpdatePayload to the DID document.
   *
   * Each update is applied to the document and duplicates are ignored. If the algorithm reaches the block with the
   * blockheight specified by a targetBlockheight, the contemporaryDIDDocument at that blockheight is returned assuming
   * a single canonical history of the DID document has been constructed up to that point.
   *
   * @static
   * @param {TraverseBlockchainParams} params The parameters for the traverseBlockchainHistory operation
   * @param {Btc1DidDocument} params.contemporaryDidDocument The DID Document at the contemporaryBlockheight
   * @param {number} params.contemporaryBlockheight The blockheight of the contemporaryDIDDocument
   * @param {number} params.currentVersionId The current versionId of the DID Document
   * @param {number} params.targetVersionId The target versionId of the DID Document
   * @param {number} params.targetBlockheight The target blockheight to resolve the DID Document
   * @param {boolean} params.updateHashHistory The hash history of the DID Document updates
   * @param {ResolutionOptions} params.sidecarData The sidecar data for the DID Document
   * @returns {Btc1DidDocument} The resolved DID Document object with a validated single, canonical history
   */
  static traverseBlochchainHistory({
    contemporaryDidDocument,
    contemporaryBlockheight,
    currentVersionId,
    targetVersionId,
    targetBlockheight,
    updateHashHistory,
    sidecarData,
  }: TraverseBlockchainParams): Btc1DidDocument {
    // Set contemporaryHash to the SHA256 hash of the contemporaryDIDDocument
    // TODO: NEED TO DEAL WITH CANONICALIZATION
    const contemporaryHash = GeneralUtils.sha256Canonicalize(contemporaryDidDocument);
    // Find all beacons in contemporaryDIDDocument.services
    // where service.type equals one of: "SingletonBeacon", "CIDAggregateBeacon" or "SMTAggregateBeacon".
    const beacons = Btc1Utils.getDidBeaconServices({ didDocument: contemporaryDidDocument });
    // For each beacon in beacons convert the beacon.serviceEndpoint to a Bitcoin address following BIP21. Set beacon.address to the Bitcoin address.
    // TODO: Do we need to do this step? My understanding was that the serviceEndpoint was already a BIP21 Bitcoin address
    // for (const beacon of beacons) { console.log('Beacon: ', beacon); }
    // Set nextSignals to the result of calling algorithm Find Next Signals passing in contemporaryBlockheight and beacons.
    const nextSignals = this.findNextSignals({ blockheight: contemporaryBlockheight, beacons });

    console.log(
      contemporaryHash,
      contemporaryDidDocument,
      targetVersionId,
      targetBlockheight,
      sidecarData,
      currentVersionId,
      updateHashHistory,
      contemporaryBlockheight);
    return contemporaryDidDocument;
  }
}