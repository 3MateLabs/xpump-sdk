import { MIGRATOR_WITNESSES } from '@interest-protocol/memez-fun-sdk';
import { bcs } from '@mysten/sui/bcs';
import { Transaction } from '@mysten/sui/transactions';
import {
  isValidSuiAddress,
  isValidSuiObjectId,
  normalizeStructTag,
  normalizeSuiAddress,
} from '@mysten/sui/utils';
import invariant from 'tiny-invariant';

import { SDK } from './sdk';
import { hexStringsToByteArrays } from './utils';
import { NewPoolArgs, PumpArgs, SdkConstructorArgs } from './xpump.types';

export class XPumpSDK extends SDK {
  constructor(args: SdkConstructorArgs | undefined | null = null) {
    super(args);
  }

  public async newPool({
    tx = new Transaction(),
    devPurchaseData = {
      developer: normalizeSuiAddress('0x0'),
      firstPurchase: this.zeroSuiCoin(tx),
    },
    metadata = {},
    virtualLiquidity,
    targetQuoteLiquidity,
    liquidityProvision = 0,
    totalSupply = this.defaultSupply,
    memeCoinTreasuryCap,
    merkleRoot,
    migratorWitness = MIGRATOR_WITNESSES.TEST,
    creationSuiFee = this.zeroSuiCoin(tx),
  }: NewPoolArgs) {
    invariant(
      liquidityProvision >= 0 && liquidityProvision <= this.MAX_BPS,
      'liquidityProvision must be between 0 and 10_000'
    );

    const { developer, firstPurchase } = devPurchaseData;

    invariant(BigInt(totalSupply) > 0n, 'totalSupply must be greater than 0');
    invariant(
      isValidSuiAddress(developer),
      'developer must be a valid Sui address'
    );

    const { memeCoinType, coinMetadataId } =
      await this.getCoinMetadataAndType(memeCoinTreasuryCap);

    const memezMetadata = tx.moveCall({
      package: this.memezPackages.MEMEZ_FUN.latest,
      module: this.memezModules.METADATA,
      function: 'new',
      arguments: [
        tx.object(coinMetadataId),
        tx.pure.vector('string', Object.keys(metadata)),
        tx.pure.vector('string', Object.values(metadata)),
      ],
      typeArguments: [normalizeStructTag(memeCoinType)],
    });

    const pumpConfig = tx.moveCall({
      package: this.memezPackages.MEMEZ_FUN.latest,
      module: this.memezModules.PUMP_CONFIG,
      function: 'new',
      arguments: [
        tx.pure.vector('u64', [
          0,
          virtualLiquidity,
          targetQuoteLiquidity,
          liquidityProvision,
          totalSupply,
        ]),
      ],
    });

    const metadataCap = tx.moveCall({
      package: this.packages.XPUMP.latest,
      module: this.modules.XPUMP,
      function: 'new',
      arguments: [
        tx.sharedObjectRef(this.memezSharedObjects.CONFIG({ mutable: false })),
        this.ownedObject(tx, memeCoinTreasuryCap),
        this.ownedObject(tx, creationSuiFee),
        pumpConfig,
        this.ownedObject(tx, firstPurchase),
        memezMetadata,
        tx.pure.address(developer),
        tx.pure.vector('u8', hexStringsToByteArrays([merkleRoot])[0]),
        this.getVersion(tx),
      ],
      typeArguments: [
        normalizeStructTag(memeCoinType),
        normalizeStructTag(migratorWitness),
      ],
    });

    return {
      metadataCap,
      tx,
    };
  }

  public async pump({
    tx = new Transaction(),
    pool,
    suiCoin,
    proof,
    minAmount = 0n,
  }: PumpArgs) {
    if (typeof pool === 'string') {
      invariant(
        isValidSuiObjectId(pool),
        'pool must be a valid Sui objectId or MemezPool'
      );
      pool = await this.getXPool(pool);
    }

    const buffer = bcs
      .vector(bcs.vector(bcs.u8()))
      .serialize(hexStringsToByteArrays(proof));

    const memeCoin = tx.moveCall({
      package: this.packages.XPUMP.latest,
      module: this.modules.XPUMP,
      function: 'pump',
      arguments: [
        tx.object(pool.objectId),
        this.ownedObject(tx, suiCoin),
        tx.pure.u64(minAmount),
        tx.pure(buffer),
        this.getVersion(tx),
      ],
      typeArguments: [pool.memezFunPool.memeCoinType],
    });

    return {
      memeCoin,
      tx,
    };
  }

  // /**
  //  * Swaps the meme coin for Sui.
  //  *
  //  * @param args - An object containing the necessary arguments to dump the meme coin into the pool.
  //  * @param args.tx - Sui client Transaction class to chain move calls.
  //  * @param args.pool - The objectId of the MemezPool or the full parsed pool.
  //  * @param args.memeCoin - The meme coin to sell for Sui.
  //  * @param args.minAmountOut - The minimum amount Sui expected to be received.
  //  *
  //  * @returns An object containing the Sui coin and the transaction.
  //  * @returns values.quoteCoin - The quote coin.
  //  * @returns values.tx - The Transaction.
  //  */
  // public async dump({
  //   tx = new Transaction(),
  //   pool,
  //   memeCoin,
  //   minAmountOut = 0n,
  // }: DumpArgs) {
  //   if (typeof pool === 'string') {
  //     invariant(
  //       isValidSuiObjectId(pool),
  //       'pool must be a valid Sui objectId or MemezPool'
  //     );
  //     pool = await this.getPumpPool(pool);
  //   }

  //   invariant(!pool.usesTokenStandard, 'pool uses token standard');

  //   const quoteCoin = tx.moveCall({
  //     package: this.packages.MEMEZ_FUN.latest,
  //     module: this.modules.PUMP,
  //     function: 'dump',
  //     arguments: [
  //       tx.object(pool.objectId),
  //       tx.object(pool.ipxMemeCoinTreasury),
  //       this.ownedObject(tx, memeCoin),
  //       tx.pure.u64(minAmountOut),
  //       this.getVersion(tx),
  //     ],
  //     typeArguments: [pool.memeCoinType, pool.quoteCoinType],
  //   });

  //   return {
  //     quoteCoin,
  //     tx,
  //   };
  // }

  // /**
  //  * Allows the developer to claim the first purchase coins. It can only be done after the pool migrates.
  //  *
  //  * @param args - An object containing the necessary arguments to claim the first purchase coins.
  //  * @param args.tx - Sui client Transaction class to chain move calls.
  //  * @param args.pool - The objectId of the MemezPool or the full parsed pool.
  //  *
  //  * @returns An object containing the meme coin and the transaction.
  //  * @returns values.memeCoin - The meme coin.
  //  * @returns values.tx - The Transaction.
  //  */
  // public async devClaim({ tx = new Transaction(), pool }: DevClaimArgs) {
  //   if (typeof pool === 'string') {
  //     invariant(
  //       isValidSuiObjectId(pool),
  //       'pool must be a valid Sui objectId or MemezPool'
  //     );
  //     pool = await this.getPumpPool(pool);
  //   }

  //   const memeCoin = tx.moveCall({
  //     package: this.packages.MEMEZ_FUN.latest,
  //     module: this.modules.PUMP,
  //     function: 'dev_purchase_claim',
  //     arguments: [tx.object(pool.objectId), this.getVersion(tx)],
  //     typeArguments: [pool.memeCoinType, pool.quoteCoinType],
  //   });

  //   return {
  //     memeCoin,
  //     tx,
  //   };
  // }

  // /**
  //  * Migrates the pool to DEX based on the MigrationWitness.
  //  *
  //  * @param args - An object containing the necessary arguments to migrate the pool.
  //  * @param args.tx - Sui client Transaction class to chain move calls.
  //  * @param args.pool - The objectId of the MemezPool or the full parsed pool.
  //  *
  //  * @returns An object containing the migrator and the transaction.
  //  * @returns values.migrator - The migrator.
  //  * @returns values.tx - The Transaction.
  //  */
  // public async migrate({ tx = new Transaction(), pool }: MigrateArgs) {
  //   if (typeof pool === 'string') {
  //     invariant(
  //       isValidSuiObjectId(pool),
  //       'pool must be a valid Sui objectId or MemezPool'
  //     );
  //     pool = await this.getPumpPool(pool);
  //   }

  //   const migrator = tx.moveCall({
  //     package: this.packages.XPUMP.latest,
  //     module: this.modules.XPUMP,
  //     function: 'migrate',
  //     arguments: [tx.object(pool.objectId), this.getVersion(tx)],
  //     typeArguments: [pool.memeCoinType],
  //   });

  //   return {
  //     migrator,
  //     tx,
  //   };
  // }

  // /**
  //  * Quotes the amount of meme coin received after selling Sui. The swap fee is from the coin in (Sui).
  //  *
  //  * @param args - An object containing the necessary arguments to quote the amount of meme coin received after selling Sui.
  //  * @param args.pool - The objectId of the MemezPool or the full parsed pool.
  //  * @param args.amount - The amount of Sui to sell.
  //  *
  //  * @returns An object containing the amount of meme coin received and the swap in fee.
  //  * @returns values.memeAmountOut - The amount of meme coin received.
  //  * @returns values.swapFeeIn - The swap fee in paid in Sui.
  //  */
  // public async quotePump({
  //   pool,
  //   amount,
  // }: QuoteArgs): Promise<QuotePumpReturnValues> {
  //   if (BigInt(amount) == 0n) return { memeAmountOut: 0n, swapFeeIn: 0n };
  //   if (typeof pool === 'string') {
  //     invariant(
  //       isValidSuiObjectId(pool),
  //       'pool must be a valid Sui objectId or MemezPool'
  //     );
  //     pool = await this.getPumpPool(pool);
  //   }

  //   const tx = new Transaction();

  //   tx.moveCall({
  //     package: this.packages.MEMEZ_FUN.latest,
  //     module: this.modules.PUMP,
  //     function: 'pump_amount',
  //     arguments: [tx.object(pool.objectId), tx.pure.u64(amount)],
  //     typeArguments: [pool.memeCoinType, pool.quoteCoinType],
  //   });

  //   const result = await devInspectAndGetReturnValues(this.client, tx, [
  //     [bcs.vector(bcs.u64())],
  //   ]);

  //   const [memeAmountOut, swapFeeIn] = result[0][0].map((value: string) =>
  //     BigInt(value)
  //   );

  //   return { memeAmountOut, swapFeeIn };
  // }

  // /**
  //  * Quotes the amount of Sui received after selling meme coin. The swap fee is from the coin in (MemeCoin).
  //  *
  //  * @param args - An object containing the necessary arguments to quote the amount of Sui received after selling meme coin.
  //  * @param args.pool - The objectId of the MemezPool or the full parsed pool.
  //  * @param args.amount - The amount of meme coin to sell.
  //  *
  //  * @returns An object containing the amount of Sui received and the swap in fee.
  //  * @returns values.quoteAmountOut - The amount of Sui received.
  //  * @returns values.swapFeeIn - The swap fee in paid in MemeCoin.
  //  * @returns values.burnFee - The burn fee in MemeCoin.
  //  */
  // public async quoteDump({
  //   pool,
  //   amount,
  // }: QuoteArgs): Promise<QuoteDumpReturnValues> {
  //   if (BigInt(amount) == 0n)
  //     return { quoteAmountOut: 0n, swapFeeIn: 0n, burnFee: 0n };

  //   if (typeof pool === 'string') {
  //     invariant(
  //       isValidSuiObjectId(pool),
  //       'pool must be a valid Sui objectId or MemezPool'
  //     );
  //     pool = await this.getPumpPool(pool);
  //   }

  //   const tx = new Transaction();

  //   tx.moveCall({
  //     package: this.packages.MEMEZ_FUN.latest,
  //     module: this.modules.PUMP,
  //     function: 'dump_amount',
  //     arguments: [tx.object(pool.objectId), tx.pure.u64(amount)],
  //     typeArguments: [pool.memeCoinType, pool.quoteCoinType],
  //   });

  //   const result = await devInspectAndGetReturnValues(this.client, tx, [
  //     [bcs.vector(bcs.u64())],
  //   ]);

  //   const [quoteAmountOut, swapFeeIn, burnFee] = result[0][0].map(
  //     (value: string) => BigInt(value)
  //   );

  //   return { quoteAmountOut, swapFeeIn, burnFee };
  // }
}
