import { POW_9, TEST_POOL_ID, xpumpTestnet } from './utils.script';

(async () => {
  const { memeAmountOut, swapFeeIn } = await xpumpTestnet.quotePump({
    pool: TEST_POOL_ID,
    amount: 2n * POW_9,
  });
  console.log({ memeAmountOut, swapFeeIn });
})();
