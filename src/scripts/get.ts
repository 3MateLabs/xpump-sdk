import { log, TEST_POOL_ID, xpumpTestnet } from './utils.script';

(async () => {
  const pool = await xpumpTestnet.getXPool(TEST_POOL_ID);

  log(pool);
})();
