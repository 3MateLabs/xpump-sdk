import { Transaction } from '@mysten/sui/transactions';

import { root } from './merkle';
import { executeTx, keypair, xpumpTestnet } from './utils.script';

const TREASURY_CAP =
  '0xacc0d40d0b253e315568d8b0680785faac9f34fda64f9b8965d9fa3978fe6d86';

const TOTAL_SUPPLY = 1_000_000_000_000_000_000n;

(async () => {
  const tx = new Transaction();

  const { tx: tx2, metadataCap } = await xpumpTestnet.newPool({
    tx,
    metadata: {
      X: 'https://x.com/Meme',
      Website: 'https://meme.xyz/',
      GitHub: 'https://github.com/meme',
      videoUrl: 'https://memez.gg',
    },

    memeCoinTreasuryCap: TREASURY_CAP,
    totalSupply: TOTAL_SUPPLY,
    virtualLiquidity: 5_000_000_000,
    targetQuoteLiquidity: 3_000_000_000,
    liquidityProvision: 0,
    merkleRoot: root,
  });

  tx.transferObjects([metadataCap], tx.pure.address(keypair.toSuiAddress()));

  const result = await executeTx(tx2);

  console.log('result', result);
})();
