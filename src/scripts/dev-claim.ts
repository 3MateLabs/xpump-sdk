import { executeTx, keypair, TEST_POOL_ID, xpumpTestnet } from './utils.script';

(async () => {
  const { memeCoin, tx } = await xpumpTestnet.devClaim({
    pool: TEST_POOL_ID,
  });

  tx.transferObjects([memeCoin], keypair.toSuiAddress());

  await executeTx(tx);
})();
