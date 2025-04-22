import {
  Modules as MemezModules,
  PACKAGES as MemezPackages,
  SHARED_OBJECTS as MemezSharedObjects,
} from '@interest-protocol/memez-fun-sdk';
import { bcs } from '@mysten/sui/bcs';
import { getFullnodeUrl, SuiObjectResponse } from '@mysten/sui/client';
import { normalizeStructTag, normalizeSuiObjectId } from '@mysten/sui/utils';
import { sha3_256 } from 'js-sha3';
import { pathOr } from 'ramda';

import { PACKAGES } from './constants';
import { SdkConstructorArgs } from './xpump.types';

export const getSdkDefaultArgs = (): SdkConstructorArgs => ({
  packages: PACKAGES,
  fullNodeUrl: getFullnodeUrl('testnet'),
  memezSharedObjects: MemezSharedObjects,
  memezModules: MemezModules,
  memezPackages: MemezPackages,
});

export const serializeAddress = (address: string) =>
  bcs.Address.serialize(address).toBytes();

export const makeLeaves = (addresses: Uint8Array<ArrayBufferLike>[]) =>
  addresses.map((x) => sha3_256(x));

export const parseXPool = (object: SuiObjectResponse) => {
  return {
    objectId: normalizeSuiObjectId(pathOr('0x', ['data', 'objectId'], object)),
    version: pathOr('0', ['data', 'version'], object),
    digest: pathOr('0', ['data', 'digest'], object),
    type: normalizeStructTag(pathOr('', ['data', 'type'], object)),
    merkleRoot: Uint8Array.from(
      pathOr(
        new Uint8Array(),
        ['data', 'content', 'fields', 'merkle_root'],
        object
      )
    ),
    memezFunPool: pathOr(
      '',
      ['data', 'content', 'fields', 'memez_fun'],
      object
    ),
  };
};

export function hexStringsToByteArrays(hexStrings: string[]) {
  return hexStrings.map((hexStr) => {
    // Remove '0x' prefix if present
    const cleanHex = hexStr.replace(/^0x/i, '');

    // Create byte array
    const byteArray = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
      const hexPair = cleanHex.substring(i, i + 2);
      const byteValue = parseInt(hexPair, 16);
      byteArray.push(byteValue);
    }

    return byteArray;
  });
}
