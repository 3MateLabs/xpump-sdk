import { normalizeSuiAddress } from '@mysten/sui/utils';
import { sha3_256 } from 'js-sha3';
import MerkleTree from 'merkletreejs';
import { makeLeaves, serializeAddress } from 'src/xpump/utils';

const deathAddress = normalizeSuiAddress(
  '0xb871a42470b59c7184033a688f883cf24eb5e66eae1db62319bab27adb30d031'
);

const joseAddress = normalizeSuiAddress(
  '0xbbf31f4075625942aa967daebcafe0b1c90e6fa9305c9064983b5052ec442ef7'
);

const EasonAddress = normalizeSuiAddress(
  '0x96d9a120058197fce04afcffa264f2f46747881ba78a91beb38f103c60e315ae'
);

const dataOne = serializeAddress(deathAddress);
const dataTwo = serializeAddress(joseAddress);
const dataThree = serializeAddress(EasonAddress);

const leaves = makeLeaves([dataOne, dataTwo, dataThree]);

const tree = new MerkleTree(leaves, sha3_256, { sortPairs: true });

export const root = tree.getHexRoot();
export const deathProof = tree.getHexProof(sha3_256(dataOne));
export const joseProof = tree.getHexProof(sha3_256(dataTwo));
export const easonProof = tree.getHexProof(sha3_256(dataThree));

console.log('root', root);
console.log('death', deathProof);
console.log('jose', joseProof);
console.log('eason', easonProof);
console.log('leaves', leaves);
