import { Btc1DidDocument } from '../btc1/did-document.js';

export interface PatchOperation {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: any; // Required for add, replace, test
  from?: string; // Required for move, copy
}

export interface DidDocumentPatch {
  '@context': [
      'https://w3id.org/zcap/v1',
      'https://w3id.org/security/data-integrity/v2',
      'https://w3id.org/json-ld-patch/v1'
  ];
  patch: PatchOperation[];
}

export default class JsonPatch {
  public static apply(sourceDocument: Btc1DidDocument, documentPatch: DidDocumentPatch): Btc1DidDocument {
    const patchedDocument = JSON.parse(JSON.stringify(sourceDocument));

    for (const operation of documentPatch.patch) {
      const { op, path, value, from } = operation;

      const segments = path.split('/').slice(1);

      switch (op) {
        case 'add':
          JsonPatch.setValue(patchedDocument, segments, value);
          break;

        case 'remove':
          JsonPatch.removeValue(patchedDocument, segments);
          break;

        case 'replace':
          JsonPatch.setValue(patchedDocument, segments, value);
          break;

        case 'move':{
          if (!from) throw new Error('Missing \'from\' in move operation');
          const fromSegments = from.split('/').slice(1);
          const movedValue = JsonPatch.getValue(patchedDocument, fromSegments);
          JsonPatch.removeValue(patchedDocument, fromSegments);
          JsonPatch.setValue(patchedDocument, segments, movedValue);
          break;
        }
        case 'copy':{
          if (!from) throw new Error('Missing \'from\' in copy operation');
          const copiedValue = JsonPatch.getValue(patchedDocument, from.split('/').slice(1));
          JsonPatch.setValue(patchedDocument, segments, copiedValue);
          break;

        }
        case 'test':{
          const existingValue = JsonPatch.getValue(patchedDocument, segments);
          if (JSON.stringify(existingValue) !== JSON.stringify(value)) {
            throw new Error(`Test operation failed at path: ${path}`);
          }
          break;
        }
        default:
          throw new Error(`Unsupported JSON Patch operation: ${op}`);
      }
    }

    return patchedDocument;
  }

  private static getValue(obj: any, path: string[]): any {
    return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  private static setValue(obj: any, path: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in current)) current[key] = {};
      current = current[key];
    }
    current[path[path.length - 1]] = value;
  }

  private static removeValue(obj: any, path: string[]): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in current)) return;
      current = current[key];
    }
    delete current[path[path.length - 1]];
  }
}