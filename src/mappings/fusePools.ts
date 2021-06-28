import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import {
  FusePoolDirectory,
  FusePoolDirectory__poolsResult,
  PoolRegistered
} from '../types/FusePoolDirectory/FusePoolDirectory'
import { Pool } from '../types/schema'
import { Comptroller } from '../types/templates/Comptroller/Comptroller'

/**
 * @dev Creates FusePool entity
 * @param comptrollerAddress 
 * @returns pool A `FusePool` object
 */
export function createPool(_comptrollerAddress: string): Pool {
  let pool: Pool,
    comptrollerAddress: Address = Address.fromString(_comptrollerAddress)

  let contract = Comptroller.bind(comptrollerAddress)
  let admin = contract.try_admin()

  pool = new Pool(_comptrollerAddress)

  admin.reverted // pool.value1
    ? pool.creator = Address.fromString('0x0000000000000000000000000000000000000000')
    : pool.creator = admin.value

  pool.id = contract._address.toHexString()
  pool.comptroller = contract._address
  pool.name = contract._name
  pool.blockPosted = BigInt.fromString('0')
  pool.timestampPosted = BigInt.fromString('0')

  return pool
}

/**
 * @todo NEED TO CORRECT HOW THIS IS CALLED IN `comptroller.ts`!
 * @param fusePoolAddress 
 * @returns 
 */
export function updatePool(
  fusePoolAddress: Address
  // blockNumber: i32,
  // blockTimestamp: i32
): Pool {
  let poolID = fusePoolAddress.toHexString()
  let pool = Pool.load(poolID)
  if (pool == null) {
    pool = createPool(poolID)
  }

  let contractAddress = Address.fromString(pool.id)
  let contract = Comptroller.bind(contractAddress)

  pool.name = contract._name
  pool.comptroller = contract._address
  pool.creator = contract.admin()
  pool.closeFactor = contract.closeFactorMantissa()
  pool.liquidationIncentive = contract.liquidationIncentiveMantissa()
  pool.priceOracle = contract.oracle()
  pool.id = contract._address.toHexString()
  pool.maxAssets = contract.maxAssets()

  pool.save()

  return pool as Pool
}

