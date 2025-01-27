import { getMemeCoinMarketCap } from '../../memez/utils';
import { log, memezTestnet, TEST_POOL_ID } from '../utils.script';
(async () => {
  const r = await memezTestnet.getPumpPool(TEST_POOL_ID);

  const marketCap = await getMemeCoinMarketCap({
    suiBalance: r.curveState.suiBalance,
    virtualLiquidity: r.curveState.virtualLiquidity,
    memeBalance: r.curveState.memeBalance,
    suiUSDCPrice: 5,
  });

  log(marketCap);
})();
