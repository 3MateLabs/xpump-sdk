import { POW_9, TEST_POOL_ID, xpumpTestnet } from './utils.script';

(async () => {
  const { quoteAmountOut, swapFeeIn, burnFee } = await xpumpTestnet.quoteDump({
    pool: TEST_POOL_ID,
    amount: 10_500_000n * POW_9,
  });

  console.log({ quoteAmountOut, swapFeeIn, burnFee });
})();
