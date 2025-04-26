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
      '0x9877fd4cade7740a391e4bb25c81bbe4763a905dd3f26608e9d53e9cd5f14c06'
    ),
    latest: normalizeSuiAddress(
      '0x9877fd4cade7740a391e4bb25c81bbe4763a905dd3f26608e9d53e9cd5f14c06'
    ),
  },
} as const;

export const OWNED_OBJECTS = {
  PUBLISHER: normalizeSuiAddress(
    '0x58249112d80f238180ce464eb9306192422e35496e6dc99929d7f081a3b109c4'
  ),
  XPUMP_UPGRADE_CAP: normalizeSuiObjectId(
    '0x87955aaed5f629806fd79d63dacdcea46762ad58f9e297220207b4bf95382425'
  ),
  XPUMP_SUPER_ADMIN: normalizeSuiAddress(
    '0xeedafb9ca3b26683bb150e75987520a5c9efee7bdf2c82dad19f01f099ea74ef'
  ),
} as const;

export const SHARED_OBJECTS = {
  XPUMP_CONFIG: ({ mutable }: { mutable: boolean }) => ({
    objectId: normalizeSuiObjectId(
      '0xa87506c7eb3ed93c78dd8159f38e8cebd8b7fa081197b3ba68a151c5b9372287'
    ),
    initialSharedVersion: '395367275',
    mutable,
  }),
  XPUMP_ACL: ({ mutable }: { mutable: boolean }) => ({
    objectId: normalizeSuiObjectId(
      '0x43f0f8e2a1cf152a5ebc0992a0f470593ce70dff24582ea586f374ee269ae9b7'
    ),
    initialSharedVersion: '395367275',
    mutable,
  }),
} as const;

export const TYPES = {
  XPUMP_CONFIG_KEY: normalizeStructTag(
    `${PACKAGES.XPUMP.original}::xpump::MemezConfigKey`
  ),
  XPUMP_OTW: normalizeStructTag(`${PACKAGES.XPUMP.original}::xpump::XPUMP`),
} as const;

export const MAX_BPS = 10_000n;
