import { DidBtc1 } from '../src/did-btc1.js';
import { versions, networks, idTypes, intermediateDocument } from '../tests/test-data.js';
const idType = idTypes.external;
const results = await Promise.all(
  versions
    .flatMap(version => networks.map(network => [version, network]))
    .map(async ([version, network]) =>
      await DidBtc1.create({
        options              : { version, network, idType },
        intermediateDocument : JSON.parse(JSON.stringify(intermediateDocument))
      }))
);
results.map(result => console.log(JSON.stringify(result, null, 2)));