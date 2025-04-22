import {
  MemezFunSharedObjects,
  Modules as MemezModules,
  PACKAGES as MemezPackages,
  PumpPool as MemezPumpPool,
  PumpTypes as MemezPumpTypes,
} from '@interest-protocol/memez-fun-sdk';
import {
  ObjectRef,
  Transaction,
  TransactionObjectArgument,
} from '@mysten/sui/transactions';

import type { PACKAGES } from './constants';

export type ObjectInput = TransactionObjectArgument | string | ObjectRef;

export type U64 = string | bigint | number;

export type StructTag = {
  address: string;
  module: string;
  name: string;
  typeParams: (string | StructTag)[];
};

export interface MaybeTx {
  tx?: Transaction;
}

export interface PackageValues {
  original: string;
  latest: string;
}

export interface SdkConstructorArgs {
  fullNodeUrl?: string;
  packages?: typeof PACKAGES;
  memezSharedObjects?: MemezFunSharedObjects;
  memezModules?: typeof MemezModules;
  memezPackages?: typeof MemezPackages;
}

export interface NewPoolArgs extends MaybeTx {
  creationFee?: MemezPumpTypes.NewPumpPoolArgs['creationSuiFee'];
  devPurchaseData?: MemezPumpTypes.NewPumpPoolArgs['devPurchaseData'];
  metadata?: Record<string, string>;
  virtualLiquidity: U64;
  targetQuoteLiquidity: U64;
  liquidityProvision?: number;
  totalSupply?: U64;
  memeCoinTreasuryCap: MemezPumpTypes.NewPumpPoolArgs['memeCoinTreasuryCap'];
  creationSuiFee?: MemezPumpTypes.NewPumpPoolArgs['creationSuiFee'];
  merkleRoot: string;
  migratorWitness?: string;
}

export interface MigrateArgs extends MaybeTx {
  pool: string;
}

export interface XPool {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  merkleRoot: Uint8Array<ArrayBuffer>;
  memezFunPool: MemezPumpPool;
}

export interface PumpArgs extends MaybeTx {
  pool: string | XPool;
  proof: string[];
  suiCoin: MemezPumpTypes.PumpArgs['quoteCoin'];
  minAmount?: U64;
}
