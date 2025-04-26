import { AclSDK } from '@interest-protocol/acl-sdk';
import { PACKAGES as MEMEZ_PACKAGES } from '@interest-protocol/memez-fun-sdk';
import { getFullnodeUrl } from '@mysten/sui/client';

import { SHARED_OBJECTS, TYPES } from './constants';

const aclSharedObject = SHARED_OBJECTS.XPUMP_ACL({ mutable: true });

export const makeXPumpAclSdk = (rpc: string = getFullnodeUrl('testnet')) =>
  new AclSDK({
    package: MEMEZ_PACKAGES.INTEREST_ACL.latest,
    fullNodeUrl: rpc,
    otw: TYPES.XPUMP_OTW,
    aclObjectId: aclSharedObject.objectId,
    aclInitialSharedVersion: aclSharedObject.initialSharedVersion,
  });
