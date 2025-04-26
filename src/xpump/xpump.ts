import {
  MIGRATOR_WITNESSES,
  PumpTypes,
} from '@interest-protocol/memez-fun-sdk';
import { bcs } from '@mysten/sui/bcs';
import { Transaction } from '@mysten/sui/transactions';
import {
  isValidSuiAddress,
  isValidSuiObjectId,
  normalizeStructTag,
  normalizeSuiAddress,
} from '@mysten/sui/utils';
import { devInspectAndGetReturnValues } from '@polymedia/suitcase-core';
import invariant from 'tiny-invariant';

import { SDK } from './sdk';
import { hexStringsToByteArrays } from './utils';
import {
  DevClaimArgs,
  DumpArgs,
  MigrateArgs,
  NewPoolArgs,
  PumpArgs,
  QuoteArgs,
  SdkConstructorArgs,
  UpdateMerkleRootAdminArgs,
  UpdateMerkleRootArgs,
} from './xpump.types';

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
        'pool must be a valid Sui objectId or xPumpPool'
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

  public async dump({
    tx = new Transaction(),
    pool,
    memeCoin,
    minAmountOut = 0n,
    proof,
  }: DumpArgs) {
    if (typeof pool === 'string') {
      invariant(
        isValidSuiObjectId(pool),
        'pool must be a valid Sui objectId or MemezPool'
      );
      pool = await this.getXPool(pool);
    }

    invariant(proof.length > 0, 'proof must be a non-empty array');

    const buffer = bcs
      .vector(bcs.vector(bcs.u8()))
      .serialize(hexStringsToByteArrays(proof));

    const quoteCoin = tx.moveCall({
      package: this.packages.XPUMP.latest,
      module: this.modules.XPUMP,
      function: 'dump',
      arguments: [
        tx.object(pool.objectId),
        tx.object(pool.memezFunPool.ipxMemeCoinTreasury),
        this.ownedObject(tx, memeCoin),
        tx.pure.u64(minAmountOut),
        tx.pure(buffer),
        this.getVersion(tx),
      ],
      typeArguments: [pool.memezFunPool.memeCoinType],
    });

    return {
      quoteCoin,
      tx,
    };
  }

  public async devClaim({ tx = new Transaction(), pool }: DevClaimArgs) {
    if (typeof pool === 'string') {
      invariant(
        isValidSuiObjectId(pool),
        'pool must be a valid Sui objectId or MemezPool'
      );
      pool = await this.getXPool(pool);
    }

    const memeCoin = tx.moveCall({
      package: this.packages.XPUMP.latest,
      module: this.modules.XPUMP,
      function: 'dev_purchase_claim',
      arguments: [tx.object(pool.objectId), this.getVersion(tx)],
      typeArguments: [pool.memezFunPool.memeCoinType],
    });

    return {
      memeCoin,
      tx,
    };
  }

  public async migrate({ tx = new Transaction(), pool }: MigrateArgs) {
    if (typeof pool === 'string') {
      invariant(
        isValidSuiObjectId(pool),
        'pool must be a valid Sui objectId or MemezPool'
      );
      pool = await this.getXPool(pool);
    }

    const migrator = tx.moveCall({
      package: this.packages.XPUMP.latest,
      module: this.modules.XPUMP,
      function: 'migrate',
      arguments: [tx.object(pool.objectId), this.getVersion(tx)],
      typeArguments: [pool.memezFunPool.memeCoinType],
    });

    return {
      migrator,
      tx,
    };
  }

  public async quotePump({
    pool,
    amount,
  }: QuoteArgs): Promise<PumpTypes.QuotePumpReturnValues> {
    if (BigInt(amount) == 0n)
      return { memeAmountOut: 0n, quoteFee: 0n, memeFee: 0n };
    if (typeof pool === 'string') {
      invariant(
        isValidSuiObjectId(pool),
        'pool must be a valid Sui objectId or MemezPool'
      );
      pool = await this.getXPool(pool);
    }

    const tx = new Transaction();

    tx.moveCall({
      package: this.packages.XPUMP.latest,
      module: this.modules.XPUMP,
      function: 'quote_pump',
      arguments: [tx.object(pool.objectId), tx.pure.u64(amount)],
      typeArguments: [pool.memezFunPool.memeCoinType],
    });

    const result = await devInspectAndGetReturnValues(this.client, tx, [
      [bcs.vector(bcs.u64())],
    ]);

    const [memeAmountOut, quoteFee, memeFee] = result[0][0].map(
      (value: string) => BigInt(value)
    );

    return { memeAmountOut, quoteFee, memeFee };
  }

  public async quoteDump({
    pool,
    amount,
  }: QuoteArgs): Promise<PumpTypes.QuoteDumpReturnValues> {
    if (BigInt(amount) == 0n)
      return { quoteAmountOut: 0n, quoteFee: 0n, memeFee: 0n, burnFee: 0n };

    if (typeof pool === 'string') {
      invariant(
        isValidSuiObjectId(pool),
        'pool must be a valid Sui objectId or MemezPool'
      );
      pool = await this.getXPool(pool);
    }

    const tx = new Transaction();

    tx.moveCall({
      package: this.packages.XPUMP.latest,
      module: this.modules.XPUMP,
      function: 'quote_dump',
      arguments: [tx.object(pool.objectId), tx.pure.u64(amount)],
      typeArguments: [pool.memezFunPool.memeCoinType],
    });

    const result = await devInspectAndGetReturnValues(this.client, tx, [
      [bcs.vector(bcs.u64())],
    ]);

    const [quoteAmountOut, memeFee, burnFee, quoteFee] = result[0][0].map(
      (value: string) => BigInt(value)
    );

    return { quoteAmountOut, memeFee, burnFee, quoteFee };
  }

  public async updateMerkleRoot({
    tx = new Transaction(),
    pool,
    newMerkleRoot,
  }: UpdateMerkleRootArgs) {
    if (typeof pool === 'string') {
      invariant(
        isValidSuiObjectId(pool),
        'pool must be a valid Sui objectId or MemezPool'
      );
      pool = await this.getXPool(pool);
    }

    tx.moveCall({
      package: this.packages.XPUMP.latest,
      module: this.modules.XPUMP,
      function: 'update_merkle_root',
      arguments: [
        tx.object(pool.objectId),
        tx.sharedObjectRef(this.memezSharedObjects.CONFIG({ mutable: false })),
        tx.pure.vector('u8', hexStringsToByteArrays([newMerkleRoot])[0]),
      ],
      typeArguments: [pool.memezFunPool.memeCoinType],
    });

    return {
      tx,
    };
  }

  public async updateMerkleRootAdmin({
    tx = new Transaction(),
    pool,
    newMerkleRoot,
    adminWitness,
  }: UpdateMerkleRootAdminArgs) {
    if (typeof pool === 'string') {
      invariant(
        isValidSuiObjectId(pool),
        'pool must be a valid Sui objectId or MemezPool'
      );
      pool = await this.getXPool(pool);
    }

    tx.moveCall({
      package: this.packages.XPUMP.latest,
      module: this.modules.XPUMP,
      function: 'update_merkle_root_admin',
      arguments: [
        tx.object(pool.objectId),
        tx.pure.vector('u8', hexStringsToByteArrays([newMerkleRoot])[0]),
        this.ownedObject(tx, adminWitness),
      ],
      typeArguments: [pool.memezFunPool.memeCoinType],
    });

    return {
      tx,
    };
  }
}
