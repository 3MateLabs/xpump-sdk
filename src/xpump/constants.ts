import {
  normalizeStructTag,
  normalizeSuiAddress,
  normalizeSuiObjectId,
} from '@mysten/sui/utils';

export enum Modules {
  XPUMP = 'xpump',
}

export const PACKAGES = {
  XPUMP: {
    original: normalizeSuiAddress(
      '0x7ae917b9126825e2ec76ae8569c21851f33a68f21d2828507963a62d184d743b'
    ),
    latest: normalizeSuiAddress(
      '0x7ae917b9126825e2ec76ae8569c21851f33a68f21d2828507963a62d184d743b'
    ),
  },
} as const;

export const OWNED_OBJECTS = {
  XPUMP_UPGRADE_CAP: normalizeSuiObjectId(
    '0xeb81034dd7c37d9b2a39ceffcd0b2e56a6df08a35971e857737ab3bc4f65068e'
  ),
} as const;

export const TYPES = {
  XPUMP_CONFIG_KEY: normalizeStructTag(
    `${PACKAGES.XPUMP.original}::xpump::MemezConfigKey`
  ),
} as const;

export const MAX_BPS = 10_000n;
