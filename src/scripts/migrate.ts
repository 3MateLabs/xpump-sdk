import { MigratorSDK } from '@interest-protocol/memez-fun-sdk';

import { executeTx, TEST_POOL_ID, xpumpTestnet } from './utils.script';

(async () => {
  const { tx, migrator } = await xpumpTestnet.migrate({
    pool: TEST_POOL_ID,
  });

  const pool = await xpumpTestnet.getXPool(TEST_POOL_ID);

  const migratorSDK = new MigratorSDK();

  const { tx: tx2 } = migratorSDK.migrate({
    tx,
    migrator,
    memeCoinType: pool.memezFunPool.memeCoinType,
    quoteCoinType: pool.memezFunPool.quoteCoinType,
  });

  await executeTx(tx2);
})();
