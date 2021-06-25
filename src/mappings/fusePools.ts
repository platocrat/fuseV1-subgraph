import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import {
  FusePoolDirectory,
  FusePoolDirectory__poolsResult,
  PoolRegistered
} from '../types/FusePoolDirectory/FusePoolDirectory'
import { FusePool } from '../types/schema'
import { Comptroller } from '../types/templates/Comptroller/Comptroller'

/**
 * @todo 
 * @dev
 * @param comptrollerAddress 
 * @returns fusePool A `FusePool` object
 */
export function createPool(_comptrollerAddress: string, _poolRegistered: PoolRegistered): FusePool {
  let fusePool: FusePool,
    fusePoolDirectoryAddress: Address = Address.fromString('0x835482FE0532f169024d5E9410199369aAD5C77E'),
    comptrollerAddress: Address = Address.fromString(_comptrollerAddress)

  let fusePoolDirectory = FusePoolDirectory.bind(fusePoolDirectoryAddress),
    comptroller = Comptroller.bind(comptrollerAddress)

  fusePool = new FusePool(_comptrollerAddress)

  let pool = fusePoolDirectory.try_pools(_poolRegistered.logIndex),
    admin = comptroller.try_admin()

  fusePool.id = _comptrollerAddress
  fusePool.comptroller = comptrollerAddress // pool.value2
  admin.reverted // pool.value1
    ? fusePool.creator = Address.fromString('0x0000000000000000000000000000000000000000')
    : fusePool.creator = admin.value

  if (pool.reverted) {
    let _timestamp = BigInt.fromString('9999999999'),
      _blockPosted = BigInt.fromString('9999999999')

    fusePool.name = 'no name detected'
    fusePool.blockPosted = _blockPosted
    fusePool.timestampPosted = _timestamp
  } else {
    fusePool.name = pool.value.value0
    fusePool.blockPosted = pool.value.value3 // pool.value3
    fusePool.timestampPosted = pool.value.value4 // pool.
  }

  return fusePool
}