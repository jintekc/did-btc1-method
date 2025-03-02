import BitcoinRpc from '../../src/bitcoin/rpc-client.js';
import { POLAR_BOB_CLIENT_CONFIG } from '../../src/constants/bitcoin.js';
import { BlockV3 } from '../../src/types/bitcoin.js';

const bob = BitcoinRpc.connect(POLAR_BOB_CLIENT_CONFIG);
const blockheight = 4461;
const blockhash = await bob.getBlockHash(blockheight);
const block = await bob.getBlock(blockhash, 2) as BlockV3;
console.log('block', block);

for(let tx of block.tx) {
  console.log(`txn w/ txid: ${tx.txid}`, tx);
  for (const vout of tx?.vout){
    console.log(`\nvout #${vout.n}`, vout);
    console.log('\nvout.scriptPubKey', vout.scriptPubKey);
  }

  for (const vin of tx.vin){
    console.log('\nvin', vin);
    console.log('\nvin.scriptSig', vin.scriptSig);
    console.log('\nvin.vout', vin.vout);
    if(!vin.vout) continue;
    const vout = tx.vout[vin.vout];
    console.log('\nvout', vout);
  }
}