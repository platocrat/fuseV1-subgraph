/* eslint-disable prefer-const */ // to satisfy AS compiler
import {
  PoolRegistered,
  // OwnershipTransferred
} from '../types/FusePoolDirectory/FusePoolDirectory'
import { Comptroller } from '../types/templates'
import { createPool } from './fusePools'

export function handlePoolRegistered(event: PoolRegistered): void {
  // Dynamically index all new listed Fuse pools
  Comptroller.create(event.params.pool.comptroller)
  // Create the pool for this comptroller, since it's now been registered.
  let pool = createPool(event.params.pool.comptroller.toHexString())
  pool.save()
}