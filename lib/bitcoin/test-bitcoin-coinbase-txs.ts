import BitcoinClient from '../../src/bitcoin/client.js';
import { POLAR_BOB_CLIENT_CONFIG } from '../../src/constants/bitcoin.js';
import { Block } from '../../src/types/bitcoin.js';

const bob = BitcoinClient.connect(POLAR_BOB_CLIENT_CONFIG);
const blockheight = 0;
const blockhash = await bob.getBlockHash(blockheight);
const block: Block = await bob.getBlock(blockhash, 2);
console.log('block', block);
// const txid = block.tx[0];
// console.log('txid', txid);
// const tx = await bob.getRawTransaction(txid, 1);
// console.log('tx', tx);