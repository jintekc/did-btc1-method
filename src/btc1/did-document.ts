import { DidVerificationMethod, DidDocument } from '@web5/dids';
import { BeaconService } from './beacons/interface.js';

/**
 * DID BTC1 Verification Method extends the DidVerificationMethod class adding helper methods and properties
 * @export
 * @class Btc1VerificationMethod
 * @type {Btc1VerificationMethod}
 * @implements {DidVerificationMethod}
 */
export class Btc1VerificationMethod implements DidVerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string | undefined;
  constructor(id: string, type: string, controller: string, publicKeyMultibase?: string) {
    this.id = id;
    this.type = type;
    this.controller = controller;
    this.publicKeyMultibase = publicKeyMultibase;
  }

  // TODO: Add helper methods and properties
}

/**
 * BTC1 DID Document extends the DidDocument class adding helper methods and properties
 * @export
 * @class Btc1DidDocument
 * @type {Btc1DidDocument}
 * @implements {DidDocument}
 */
export class Btc1DidDocument implements DidDocument {
  id: string;
  '@context'?: string | (string | Record<string, any>)[] | undefined;
  alsoKnownAs?: string[] | undefined;
  controller?: string | string[] | undefined;
  verificationMethod: DidVerificationMethod[];
  assertionMethod?: (string | DidVerificationMethod)[] | undefined;
  authentication?: (string | DidVerificationMethod)[] | undefined;
  keyAgreement?: (string | DidVerificationMethod)[] | undefined;
  capabilityDelegation?: (string | DidVerificationMethod)[] | undefined;
  capabilityInvocation?: (string | DidVerificationMethod)[] | undefined;
  service: BeaconService[];

  constructor(id: string, verificationMethod: DidVerificationMethod[], service: BeaconService[]) {
    this.id = id;
    this.verificationMethod = verificationMethod;
    this.service = service;
  }

  public static validate(didDocument: any): { valid: boolean, errors?: string[] } {
    const errors: string[] = [];

    // 1. @context must be present and include "https://www.w3.org/ns/did/v1"
    if (!didDocument['@context']) {
      errors.push('Missing "@context" field');
    } else if (
      Array.isArray(didDocument['@context']) &&
            !didDocument['@context'].includes('https://www.w3.org/ns/did/v1')
    ) {
      errors.push('The "@context" must include "https://www.w3.org/ns/did/v1"');
    } else if (typeof didDocument['@context'] === 'string' && didDocument['@context'] !== 'https://www.w3.org/ns/did/v1') {
      errors.push('The "@context" must be "https://www.w3.org/ns/did/v1"');
    }

    // 2. id must be a valid DID
    if (!didDocument.id || typeof didDocument.id !== 'string' || !didDocument.id.startsWith('did:')) {
      errors.push('Invalid "id" field: It must be a string starting with "did:"');
    }

    // 3. Verification Methods must be valid
    if (didDocument.verificationMethod) {
      if (!Array.isArray(didDocument.verificationMethod)) {
        errors.push('"verificationMethod" must be an array.');
      } else {
        for (const method of didDocument.verificationMethod) {
          if (!method.id || !method.type || !method.controller) {
            errors.push(`Invalid verification method: ${JSON.stringify(method)}.`);
          }
        }
      }
    }

    // 4. Services must be valid
    if (didDocument.service) {
      if (!Array.isArray(didDocument.service)) {
        errors.push('"service" must be an array.');
      } else {
        for (const service of didDocument.service) {
          if (!service.id || !service.type || !service.serviceEndpoint) {
            errors.push(`Invalid service definition: ${JSON.stringify(service)}.`);
          }
        }
      }
    }

    // 5. Ensure key references are valid in authentication, assertionMethod, keyAgreement, etc.
    const keySections = [
      'authentication',
      'assertionMethod',
      'keyAgreement',
      'capabilityInvocation',
      'capabilityDelegation'
    ];

    for (const section of keySections) {
      if (didDocument[section]) {
        if (!Array.isArray(didDocument[section])) {
          errors.push(`"${section}" must be an array.`);
        } else {
          for (const entry of didDocument[section]) {
            if (typeof entry !== 'string' && typeof entry !== 'object') {
              errors.push(`Invalid entry in "${section}": ${JSON.stringify(entry)}.`);
            }
          }
        }
      }
    }

    return { valid: true };
  }
}