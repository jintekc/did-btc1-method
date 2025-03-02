// import { POLAR_ALICE_CLIENT_CONFIG } from '../../src';
import BitcoinClient from '../../src/bitcoin/client';
import { POLAR_BOB_CLIENT_CONFIG } from '../../src/constants/bitcoin';

// const alice = BitcoinClient.connect(POLAR_ALICE_CLIENT_CONFIG);
const bob = BitcoinClient.connect(POLAR_BOB_CLIENT_CONFIG);


// const aliceTxIds = [
//   '1fc1f663d692e35d8c2ad48785306717b0b210ea1d4df92a0ab7e50316fbffbf',
//   ',b19b14dbd155430fc4ccd3162678ac1c109f1de1636eb2200b405d242c1a35d9',
//   '1,b11151e37b04f4575d3ee0eaa7b474270eedc5e1f31607f274344df6c331b13',
//   'c0,b5fe9e77ef1e5aa14b8181b63fc12b6a43d65085f28db9b7b38733a70febf8',
//   '7e2,a28d123fc6d2569f8682348666becd0eb13577c4dd337568afa5c8f0d2c2a',
//   '9d10,b4e9fa528d8785dd7da4372b8ff0219616ea72d720bf633ba8c44d4ba6b7',
//   '08bd8,f11275e2a04c2e4496e30be2789538f3ef0cc66248214150ed81fd1b9a8',
//   '6b24ce,8013922b091d8eb908e7b8b29478364f4ef6fceb2610a664bad72b90c9',
//   '6d0b367,1498c5dbda19cabfd0f6e9f28b274ba0db35e7d592fec45fb99ab8e69',
//   'bfda1a06,29218544c67a1b8f423887d014c89ae8c0772697bde15337e09500de',
// ];
const bobTxIds = [
  '1fc1f663d692e35d8c2ad48785306717b0b210ea1d4df92a0ab7e50316fbffbf',
  'b19b14dbd155430fc4ccd3162678ac1c109f1de1636eb2200b405d242c1a35d9',
  '1b11151e37b04f4575d3ee0eaa7b474270eedc5e1f31607f274344df6c331b13',
  'c0b5fe9e77ef1e5aa14b8181b63fc12b6a43d65085f28db9b7b38733a70febf8',
  '7e2a28d123fc6d2569f8682348666becd0eb13577c4dd337568afa5c8f0d2c2a',
  '9d10b4e9fa528d8785dd7da4372b8ff0219616ea72d720bf633ba8c44d4ba6b7',
  '08bd8f11275e2a04c2e4496e30be2789538f3ef0cc66248214150ed81fd1b9a8',
  '6b24ce8013922b091d8eb908e7b8b29478364f4ef6fceb2610a664bad72b90c9',
  '6d0b3671498c5dbda19cabfd0f6e9f28b274ba0db35e7d592fec45fb99ab8e69',
  'bfda1a0629218544c67a1b8f423887d014c89ae8c0772697bde15337e09500de'
];

for (const txid of bobTxIds) {
  const tx = await bob.getRawTransaction(txid, 1);
  for (const vout of tx.vout){
    console.log(`vout #${vout.n}`, vout);
    console.log('vout.scriptPubKey', vout.scriptPubKey);
  }

  for (const vin of tx.vin){
    console.log('vin', vin);
    console.log('vin.scriptSig', vin.scriptSig);
    console.log('vin.vout', vin.vout);
    const vout = tx.vout[vin.vout];
    console.log('vout', vout);
  }
}