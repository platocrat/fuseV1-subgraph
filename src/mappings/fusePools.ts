import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import {
  FusePoolDirectory,
  FusePoolDirectory__poolsResult,
  PoolRegistered
} from '../types/FusePoolDirectory/FusePoolDirectory'
import { FusePool, Comptroller } from '../types/schema'

/**
 * @dev Creates FusePool entity
 * @param comptrollerAddress 
 * @returns fusePool A `FusePool` object
 */
export function createPool(_comptrollerAddress: string): FusePool {
  let fusePool: FusePool,
    comptrollerAddress: Address = Address.fromString(_comptrollerAddress)

  let contract = Comptroller.bind(comptrollerAddress)
  let admin = contract.try_admin()

  fusePool = new FusePool(_comptrollerAddress)

  admin.reverted // pool.value1
    ? fusePool.creator = Address.fromString('0x0000000000000000000000000000000000000000')
    : fusePool.creator = admin.value

  fusePool.id = contract._address.toHexString()
  fusePool.comptroller = contract._address
  fusePool.name = contract._name
  fusePool.blockPosted = BigInt.fromString('0')
  fusePool.timestampPosted = BigInt.fromString('0')

  return fusePool
}

export function updateFusePool(
  fusePoolAddress: Address,
  blockNumber: i32,
  blockTimestamp: i32
): FusePool {
  let fusePoolID = fusePoolAddress.toHexString()
  let fusePool = FusePool.load(fusePoolID)
  if (fusePool == null) {
    fusePool = createPool(fusePoolID)
  }
}