import {
  GetPoolMetadataArgs,
  MemezFunSharedObjects,
  MemezPumpSDK,
  Modules as MemezModules,
  PACKAGES as MemezPackages,
  parsePumpPool,
  VecMap,
} from '@interest-protocol/memez-fun-sdk';
import { bcs } from '@mysten/sui/bcs';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { ObjectRef } from '@mysten/sui/transactions';
import { isValidSuiObjectId } from '@mysten/sui/utils';
import {
  normalizeStructTag,
  normalizeSuiAddress,
  normalizeSuiObjectId,
  SUI_FRAMEWORK_ADDRESS,
  SUI_TYPE_ARG,
} from '@mysten/sui/utils';
import { has, pathOr } from 'ramda';
import invariant from 'tiny-invariant';

import { Modules, PACKAGES } from './constants';
import { getSdkDefaultArgs } from './utils';
import { parseXPool } from './utils';
import { ObjectInput, SdkConstructorArgs, XPool } from './xpump.types';

export class SDK {
  packages: typeof PACKAGES;
  memezSharedObjects: MemezFunSharedObjects;
  memezPackages: typeof MemezPackages;
  memezModules: typeof MemezModules;
  memezPumpSDK: MemezPumpSDK;

  modules: typeof Modules;

  MAX_BPS = 10_000;

  MAX_U64 = 18446744073709551615n;

  #rpcUrl: string;

  client: SuiClient;

  defaultSupply = 1_000_000_000_000_000_000n;

  constructor(args: SdkConstructorArgs | undefined | null = null) {
    const data = {
      ...getSdkDefaultArgs(),
      ...args,
    };

    invariant(
      data.fullNodeUrl,
      'You must provide fullNodeUrl for this specific network'
    );

    invariant(
      data.packages,
      'You must provide package addresses for this specific network'
    );

    invariant(
      data.memezSharedObjects,
      'You must provide sharedObjects for this specific network'
    );

    invariant(
      data.memezModules,
      'You must provide modules for this specific network'
    );

    invariant(
      data.memezPackages,
      'You must provide packages for this specific network'
    );

    this.#rpcUrl = data.fullNodeUrl;
    this.packages = data.packages;
    this.memezSharedObjects = data.memezSharedObjects;
    this.memezModules = data.memezModules;
    this.memezPackages = data.memezPackages;
    this.modules = Modules;
    this.client = new SuiClient({ url: data.fullNodeUrl });
    this.memezPumpSDK = new MemezPumpSDK({
      fullNodeUrl: data.fullNodeUrl,
      packages: this.memezPackages,

      sharedObjects: this.memezSharedObjects,
    });
  }

  public rpcUrl() {
    return this.#rpcUrl;
  }

  getVersion(tx: Transaction) {
    return tx.moveCall({
      package: this.memezPackages.MEMEZ_FUN.latest,
      module: this.memezModules.VERSION,
      function: 'get_allowed_versions',
      arguments: [
        tx.sharedObjectRef(this.memezSharedObjects.VERSION({ mutable: false })),
      ],
    });
  }

  zeroSuiCoin(tx: Transaction) {
    return tx.moveCall({
      package: SUI_FRAMEWORK_ADDRESS,
      module: 'coin',
      function: 'zero',
      typeArguments: [SUI_TYPE_ARG],
    });
  }

  /**
   * Retrieves the Memez pool object from Sui and parses it.
   *
   * @param pumpId - The objectId of the MemezPool.
   *
   * @returns A parsed MemezPool object.
   */
  public async getXPool(xPumpId: string): Promise<XPool> {
    const object = await this.client.getObject({
      id: xPumpId,
      options: {
        showType: true,
        showContent: true,
      },
    });

    const pool = parseXPool(object);

    const memezPool = await parsePumpPool(
      this.client,
      await this.client.getObject({
        id: pool.memezFunPool,
        options: { showContent: true },
      })
    );

    return {
      ...pool,
      memezFunPool: memezPool,
    };
  }

  async getCoinMetadataAndType(memeCoinTreasuryCap: string | ObjectRef) {
    const memeCoinTreasuryCapId =
      typeof memeCoinTreasuryCap === 'string'
        ? memeCoinTreasuryCap
        : memeCoinTreasuryCap.objectId;

    invariant(
      isValidSuiObjectId(memeCoinTreasuryCapId),
      'memeCoinTreasuryCap must be a valid Sui objectId'
    );

    const treasuryCap = await this.client.getObject({
      id: memeCoinTreasuryCapId,
      options: {
        showType: true,
        showContent: true,
      },
    });

    const treasuryCapTotalSupply = +pathOr(
      /// Force an error if we do not find the field
      '1',
      ['data', 'content', 'fields', 'total_supply', 'fields', 'value'],
      treasuryCap
    );

    invariant(
      treasuryCapTotalSupply === 0,
      'TreasuryCap Error: Total Supply is not 0 or not found'
    );

    const memeCoinType = treasuryCap.data?.type?.split('<')[1].slice(0, -1);

    invariant(memeCoinType, 'Invalid TreasuryCap: no memeCoinType found');

    const coinMetadata = await this.client.getCoinMetadata({
      coinType: memeCoinType,
    });

    invariant(coinMetadata?.id, 'Invalid TreasuryCap: no coin metadata found');

    return {
      memeCoinType,
      coinMetadataId: coinMetadata.id!,
    };
  }

  ownedObject(tx: Transaction, obj: ObjectInput) {
    if (has('objectId', obj) && has('version', obj) && has('digest', obj)) {
      return tx.objectRef(obj);
    }

    return typeof obj === 'string' ? tx.object(obj) : obj;
  }
}
