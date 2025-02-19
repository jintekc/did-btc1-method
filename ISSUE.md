## Resolve (Read)

### BTC1 Methods Requiring Bitcoin Blockchain gRPC Calls
* [4.2.3.1 Determine Target Blockheight](https://gl1.dcdpr.com/btcr/btcr/-/tree/main/spec?ref_type=heads#4231-determine-target-blockheight)
* [4.2.3.2 Traverse Blockchain History](https://gl1.dcdpr.com/btcr/btcr/-/tree/main/spec?ref_type=heads#4232-traverse-blockchain-history)

### 4.2.3.1 Determine Target Blockheight

> This algorithm takes in an OPTIONAL Unix `targetTime` and returns a Bitcoin `blockheight`.
> 
> 1. If `targetTime`, find the Bitcoin `block` with greatest `blockheight` whose `timestamp` is less than the `targetTime`.
> 2. Else find the Bitcoin `block` with the greatest `blockheight` that has at least X conformations. TODO: what is X. Is it variable?
> 3. Set `blockheight` to `block.blockheight`.
> 4. Return `blockheight`.

* `bitcoin-cli` commands that provide the desired data for this algorithm: `getblockcount` => `getblockhash` => `getblock`
* We achieve the desired outcome using these methods in a loop for either arg case: `targetTime` or `X` confirmations`
* TypeScript Solution w/ `targetTime = 1739565192`

```ts
import Bitcoind from '../src/utils/bitcoind.js';
import { DEFAULT_CLIENT_CONFIG } from '../src/utils/bitcoind/constants.js';
// current regtest height = 1177
// targetTime = 1739565192 for block 1160 in local regtest
const targetTime = 1739565192;
const bob = Bitcoind.connect(DEFAULT_CLIENT_CONFIG);
async function targetTimeBlockHeight(targetTime: number) {
    let blockheight = await bob.getBlockCount();
    let blockhash = await bob.getBlockHash(blockheight);
    let block = await bob.getBlock(blockhash);

    const info = await bob.getBlockchainInfo();
    if (blockheight !== info.blocks) {
        throw new Error(`Block height mismatch! blockheight ${blockheight} !== info.blocks ${info.blocks}`)
    }

    do {
        blockhash = await bob.getBlockHash(--blockheight);
        block = await bob.getBlock(blockhash);
    } while (block.time > targetTime);

    return block;
}
const targetTimeBlock = await targetTimeBlockHeight(targetTime);
console.log(`Found first block with time < targetTime of ${targetTime}`);
console.log(`Block #${targetTimeBlock.height}`);
console.log(`Block hash: ${targetTimeBlock.hash}`);
console.log('Block', targetTimeBlock);
/*
Output

Found first block with time < targetTime of 1739565192
Block #1160
Block hash: 7dddb57419234f34900172e4c25283e9958fe32f28761d887481c54fc7e3939f
Block {
  hash: '7dddb57419234f34900172e4c25283e9958fe32f28761d887481c54fc7e3939f',
  confirmations: 30,
  height: 1160,
  version: 536870912,
  versionHex: '20000000',
  merkleroot: 'a9c425dffb82790854dee0e2ded59d7dc3d66833fdd91c61cc7fadddc448c26d',
  time: 1739565192,
  mediantime: 1739565042,
  nonce: 2,
  bits: '207fffff',
  difficulty: '4.656542373906925e-10',
  chainwork: '0000000000000000000000000000000000000000000000000000000000000912',
  nTx: 1,
  previousblockhash: '6a86cbfda6910053b4264f30f71e2327030a1129d777d143f976330fca3daf75',
  nextblockhash: '79a87f16cdbf21a36f66c4d91b69ca2b92568f79bab398b1167fa8096d3b736e',
  strippedsize: 214,
  size: 250,
  weight: 892,
  tx: [
    'a9c425dffb82790854dee0e2ded59d7dc3d66833fdd91c61cc7fadddc448c26d'
  ]
}*/

```

* TypeScript Solution w/ `X = 7` Confirmations
```ts
import Bitcoind from '../src/utils/bitcoind.js';
import { DEFAULT_CLIENT_CONFIG } from '../src/utils/bitcoind/constants.js';
const X = 7; // Look for a block with confirmations > 7
async function xConfirmationsBlockHeight() {
    let blockheight = await bob.getBlockCount();
    let blockhash = await bob.getBlockHash(blockheight);
    let block = await bob.getBlock(blockhash);

    const info = await bob.getBlockchainInfo();
    if (blockheight !== info.blocks) {
        throw new Error(`Block height mismatch! blockheight ${blockheight} !== info.blocks ${info.blocks}`)
    }

    while (block.confirmations <= X) {
        blockhash = await bob.getBlockHash(--blockheight);
        block = await bob.getBlock(blockhash);
    }

    return block;
}
const xConfirmBlock = await xConfirmationsBlockHeight();
console.log(`Found first block height with more than ${X} confirmations`);
console.log(`Block #${xConfirmBlock.height}`);
console.log(`Block hash: ${xConfirmBlock.hash}`);
console.log('Block', xConfirmBlock);
/*
Output

Found first block height with more than 7 confirmations
Block #1178
Block hash: 6bf756c713ade6a6560132544df6c837eb907af2e446af2fd424005bda8b0df1
Block {
  hash: '6bf756c713ade6a6560132544df6c837eb907af2e446af2fd424005bda8b0df1',
  confirmations: 8,
  height: 1178,
  version: 536870912,
  versionHex: '20000000',
  merkleroot: '7014878737a08ed4f137cbfb887647bba944ac15b299c1250f1f593a8f6ad03d',
  time: 1739565732,
  mediantime: 1739565582,
  nonce: 0,
  bits: '207fffff',
  difficulty: '4.656542373906925e-10',
  chainwork: '0000000000000000000000000000000000000000000000000000000000000936',
  nTx: 1,
  previousblockhash: '1d722f56d12a04accd1251b573eaff86128095186922ed9e21aa5133a10f04fa',
  nextblockhash: '673ab5223698a983b114df32060b17fdcfc404a061f9c3eeed22556957636ac2',
  strippedsize: 214,
  size: 250,
  weight: 892,
  tx: [
    '7014878737a08ed4f137cbfb887647bba944ac15b299c1250f1f593a8f6ad03d'
  ]
}
*/
```

### 4.2.3.2 Traverse Blockchain History

> This algorithm returns a `nextSignals` struct, containing a `blockheight` the signals were found in and an array of `signals`. Each `signal` is a struct containing `beaconId`, `beaconType`, and `tx` properties.
> 1. Get Bitcoin `block` at `contemporaryBlockheight`.
> 2. Set `beaconSignals` to an empty array.
> 3. For all `tx` in `block.txs`: check to see if any transaction inputs are spends from one of the Beacon addresses. If they are, create a `signal` object containing the following fields and push `signal` to `beaconSignals`

* `bitcoin-cli` commands that provide the desired data for this algorithm: `getblockhash` => `getblock`
* 

## Notes
* `getBlockchainInfo` returns multiple useful things as well so that could also be included
* In the case of no `targetTime`, we are using `X confirmations` which is TBD
* The number of safe block confirmations to wait for a Bitcoin transaction depends on the level of security needed:
  * 1 confirmation: Generally safe for small transactions, but still reversible with a powerful enough attacker
  * 3 confirmations: Reasonably secure for moderate amounts ($1,000+)
  * 6 confirmations: Considered final for most transactions, as reversing it would require massive computational power
  * 30+ confirmations: Used for high-value transfers, exchanges, or deep security needs
* I think its safe to define `X = 7` for our use case, so we're looking for a block with 8+ confirmations