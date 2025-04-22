import { Transaction } from '@mysten/sui/transactions';

import { joseProof } from './merkle';
import {
  executeTx,
  keypair,
  POW_9,
  TEST_POOL_ID,
  xpumpTestnet,
} from './utils.script';

(async () => {
  const tx = new Transaction();

  const quoteCoin = tx.splitCoins(tx.gas, [tx.pure.u64(5n * POW_9)]);

  const { memeCoin, tx: tx2 } = await xpumpTestnet.pump({
    pool: TEST_POOL_ID,
    suiCoin: quoteCoin,
    proof: joseProof,
    tx,
  });

  tx2.transferObjects([memeCoin], keypair.toSuiAddress());

  await executeTx(tx2);
})();
