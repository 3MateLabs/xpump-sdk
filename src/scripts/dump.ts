import { coinWithBalance, Transaction } from '@mysten/sui/transactions';

import { joseProof } from './merkle';
import { executeTx, keypair, TEST_POOL_ID, xpumpTestnet } from './utils.script';

(async () => {
  const tx = new Transaction();

  const pool = await xpumpTestnet.getXPool(TEST_POOL_ID);

  const memeCoin = coinWithBalance({
    balance: 1_000_000_000n,
    type: pool.memezFunPool.memeCoinType,
  })(tx);

  const { quoteCoin, tx: tx2 } = await xpumpTestnet.dump({
    pool: TEST_POOL_ID,
    memeCoin,
    proof: joseProof,
    tx,
  });

  tx2.transferObjects([quoteCoin], keypair.toSuiAddress());

  await executeTx(tx2);
})();
