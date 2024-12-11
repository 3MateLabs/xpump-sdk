import { memezTestnet, POW_9, TEST_POOL_ID } from '../utils.script';

(async () => {
  const { amountOut, swapFeeIn } = await memezTestnet.quotePump({
    pool: TEST_POOL_ID,
    amount: 15n * POW_9,
  });
  console.log({ amountOut, swapFeeIn });
})();
