import { Address } from '@graphprotocol/graph-ts'
import { FusePoolDirectory, FusePoolDirectory__poolsResult, PoolRegistered } from '../types/FusePoolDirectory/FusePoolDirectory'
import { Comptroller as Comptroller_Type, FusePool } from '../types/schema'
import { Comptroller } from '../types/templates/Comptroller/Comptroller'

/**
 * @todo 
 * @dev
 * @param comptrollerAddress 
 * @returns fusePool A `FusePool` object
 */
export function createPool(comptrollerAddress: string, poolRegistered: PoolRegistered): FusePool {
  let pool: FusePoolDirectory__poolsResult,
    fusePool: FusePool,
    fusePoolDirectoryAddress = '0x835482FE0532f169024d5E9410199369aAD5C77E'

  let fusePoolDirectory = FusePoolDirectory.bind(
    Address.fromString(fusePoolDirectoryAddress)
  ),
    comptroller = Comptroller.bind(
      Address.fromString(comptrollerAddress)
    )

  fusePool = new FusePool(comptrollerAddress)

  pool = fusePoolDirectory.pools(poolRegistered.logIndex)

  fusePool.name = pool.value0
  fusePool.creator = comptroller.admin() // pool.value1
  fusePool.comptroller = Address.fromString(comptrollerAddress) // pool.value2
  fusePool.blockPosted = pool.value3 // pool.value3
  fusePool.timestampPosted = pool.value4 // pool.value4

  return fusePool
}