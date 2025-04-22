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
      '0x85596cda5cefeba5fb75d7d07f77bbe1166615b1c06b16b895613cadb718b53a'
    ),
    latest: normalizeSuiAddress(
      '0x85596cda5cefeba5fb75d7d07f77bbe1166615b1c06b16b895613cadb718b53a'
    ),
  },
} as const;

export const OWNED_OBJECTS = {
  XPUMP_UPGRADE_CAP: normalizeSuiObjectId(
    '0x635f4d81e5b2fc62b35e10ba45f1ce6fb81f8f1898ada99b39575f0c2e8df41e'
  ),
} as const;

export const TYPES = {
  XPUMP_CONFIG_KEY: normalizeStructTag(
    `${PACKAGES.XPUMP.original}::xpump::MemezConfigKey`
  ),
} as const;

export const MAX_BPS = 10_000n;
