import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import {
  FusePoolDirectory,
  FusePoolDirectory__poolsResult,
  PoolRegistered
} from '../types/FusePoolDirectory/FusePoolDirectory'
import { Pool } from '../types/schema'
import { Comptroller } from '../types/templates/Comptroller/Comptroller'
import {
  zeroBD,
  getAllMarketsInPool,
  // getTotalSupplyUSDInPool,
  // getTotalBorrowUSDInPool
} from './helpers'

/**
 * @dev Creates FusePool entity
 * @param comptrollerAddress 
 * @returns pool A `FusePool` object
 */
export function createPool(_comptrollerAddress: string, poolRegisteredEvent: PoolRegistered | null): Pool {
  let pool: Pool,
    comptrollerAddress: Address = Address.fromString(_comptrollerAddress)

  let contract = Comptroller.bind(comptrollerAddress)
  let admin = contract.try_admin()

  pool = new Pool(_comptrollerAddress)
  pool.index = poolRegisteredEvent.params.index

  admin.reverted // pool.value1
    ? pool.creator = Address.fromString('0x0000000000000000000000000000000000000000')
    : pool.creator = admin.value

  pool.id = comptrollerAddress.toHexString()
  pool.comptroller = contract._address
  pool.blockPosted = BigInt.fromString('0')
  pool.timestampPosted = BigInt.fromString('0')

  pool.markets = getAllMarketsInPool(contract)

  return pool as Pool
}

/**
 * @param fusePoolAddress 
 * @returns pool The Fuse pool at the given Comptroller address
 */
export function updatePool(
  fusePoolAddress: Address
): Pool {
  let poolID = fusePoolAddress.toHexString()
  let pool = Pool.load(poolID)

  let contractAddress = Address.fromString(pool.id)
  let contract = Comptroller.bind(contractAddress)

  pool.id = poolID
  pool.comptroller = contract._address
  pool.creator = contract.admin()
  pool.closeFactor = contract.closeFactorMantissa()
  pool.liquidationIncentive = contract.liquidationIncentiveMantissa()
  pool.priceOracle = contract.oracle()
  pool.maxAssets = contract.maxAssets()

  let allMarkets = getAllMarketsInPool(contract)
  pool.markets = allMarkets

  pool.save()

  return pool as Pool
}
