import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import {
  FusePoolDirectory,
  FusePoolDirectory__poolsResult,
  PoolRegistered
} from '../types/FusePoolDirectory/FusePoolDirectory'
import { Comptroller as Comptroller_Type, FusePool } from '../types/schema'
import { Comptroller } from '../types/templates/Comptroller/Comptroller'

/**
 * @todo 
 * @dev
 * @param comptrollerAddress 
 * @returns fusePool A `FusePool` object
 */
export function createPool(comptrollerAddress: string, poolRegistered: PoolRegistered): FusePool {
  let fusePool: FusePool,
    fusePoolDirectoryAddress = '0x835482FE0532f169024d5E9410199369aAD5C77E'

  let fusePoolDirectory = FusePoolDirectory.bind(
    Address.fromString(fusePoolDirectoryAddress)
  ),
    comptroller = Comptroller.bind(
      Address.fromString(comptrollerAddress)
    )

  fusePool = new FusePool(comptrollerAddress)

  let pool = fusePoolDirectory.try_pools(poolRegistered.logIndex),
    admin = comptroller.try_admin()

  fusePool.id = poolRegistered.logIndex.toString()
  fusePool.comptroller = Address.fromString(comptrollerAddress) // pool.value2
  admin.reverted // pool.value1
    ? fusePool.creator = Address.fromString('0x0000000000000000000000000000000000000000')
    : fusePool.creator = admin.value

  if (pool.reverted) {
    let timestamp0 = BigInt.fromI32(0)

    fusePool.name = 'no name detected'
    fusePool.blockPosted = 'no timestamp detected'
    fusePool.timestampPosted = 'no timestamp detected'
  } else {
    fusePool.name = pool.value.value0
    fusePool.blockPosted = pool.value.value3.toString() // pool.value3
    fusePool.timestampPosted = pool.value.value4.toString() // pool.
  }


  return fusePool
}