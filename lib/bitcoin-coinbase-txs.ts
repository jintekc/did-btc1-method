import BitcoinClient from '../src/bitcoin/client.js';
import { DEFAULT_CLIENT_CONFIG } from '../src/constants/bitcoind.js';
import { BitcoinBlock } from '../src/types/bitcoind.js';

const bob = BitcoinClient.connect(DEFAULT_CLIENT_CONFIG);
const blockheight = 0;
const blockhash = await bob.getBlockHash(blockheight);
const block: BitcoinBlock = await bob.getBlock(blockhash, 2);
console.log('block', block);
// const txid = block.tx[0];
// console.log('txid', txid);
// const tx = await bob.getRawTransaction(txid, 1);
// console.log('tx', tx);