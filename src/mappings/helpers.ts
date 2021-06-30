/* eslint-disable prefer-const */ // to satisfy AS compiler

// For each division by 10, add one to exponent to truncate one significant figure
import { BigDecimal, BigInt, Bytes, Address } from '@graphprotocol/graph-ts'
import {
  AccountCToken,
  Account,
  AccountCTokenTransaction,
  Admin,
  AdminFusePool,
  AdminFusePoolTransaction,
  Market,
  Pool
} from '../types/schema'

let ONE_BI = BigInt.fromI32(1)

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}


export function convertMantissaToAPY(mantissa: BigInt, dayRange: number): BigDecimal {
  dayRange.toString()

  return mantissa
    // .div(BigInt.fromString('1e18'))
    .div(ONE_BI)
    .times(BigInt.fromString('4'))
    .times(BigInt.fromString('60'))
    .times(BigInt.fromString('64'))
    .plus(BigInt.fromString('1'))
    .pow(dayRange as u8)
    .minus(BigInt.fromString('1'))
    .times(BigInt.fromString('100'))
    .toBigDecimal()
  // return (Math.pow( * (4 * 60 * 24) + 1, dayRange) - 1) * 100;
}

export function convertMantissaToAPR(mantissa: BigInt): BigDecimal {
  return mantissa
    .times(BigInt.fromString('2372500'))
    // .div(BigInt.fromString('1e16'))
    .div(ONE_BI)
    .toBigDecimal()
  // return (mantissa.toI32() * 2372500) / 1e16;
}

export let mantissaFactor = 18
export let cTokenDecimals = 8
export let mantissaFactorBD: BigDecimal = exponentToBigDecimal(18)
export let cTokenDecimalsBD: BigDecimal = exponentToBigDecimal(8)
export let zeroBD = BigDecimal.fromString('0')

export function createAccountCToken(
  cTokenStatsID: string,
  symbol: string,
  account: string,
  marketID: string,
): AccountCToken {
  let cTokenStats = new AccountCToken(cTokenStatsID)
  cTokenStats.symbol = symbol
  cTokenStats.market = marketID
  cTokenStats.account = account
  cTokenStats.accrualBlockNumber = BigInt.fromI32(0)
  cTokenStats.cTokenBalance = zeroBD
  cTokenStats.totalUnderlyingSupplied = zeroBD
  cTokenStats.totalUnderlyingRedeemed = zeroBD
  cTokenStats.accountBorrowIndex = zeroBD
  cTokenStats.totalUnderlyingBorrowed = zeroBD
  cTokenStats.totalUnderlyingRepaid = zeroBD
  cTokenStats.storedBorrowBalance = zeroBD
  cTokenStats.enteredMarket = false
  return cTokenStats
}

// export function addMarketsToPool(marketID: string, _pool: Pool): Pool {
//   _pool.markets = // set Market entity

//   return _pool as Pool
// }

export function createAdminFusePool(
  poolStatsID: string,
  admin: string,
  poolID: string,
): AdminFusePool {
  let poolStats = new AdminFusePool(poolStatsID)
  poolStats.pool = poolID
  poolStats.admin = admin
  poolStats.accrualBlockNumber = BigInt.fromI32(0)
  poolStats.priceOracle = Address.fromString('0x0000000000000000000000000000000000000000')
  poolStats.closeFactor = BigInt.fromI32(0)
  poolStats.liquidationIncentive = BigInt.fromI32(0)
  poolStats.maxAssets = BigInt.fromI32(0)

  return poolStats
}

export function createAccount(accountID: string): Account {
  let account = new Account(accountID)
  account.countLiquidated = 0
  account.countLiquidator = 0
  account.hasBorrowed = false
  account.save()
  return account
}

export function createAdmin(adminID: string): Admin {
  let admin = new Admin(adminID)

  admin.priceOracle = Address.fromString('0x0000000000000000000000000000000000000000')
  admin.closeFactor = new BigInt(9)
  admin.liquidationIncentive = new BigInt(9)
  admin.maxAssets = new BigInt(9)

  admin.save()

  return admin
}

export function updateCommonCTokenStats(
  marketID: string,
  marketSymbol: string,
  accountID: string,
  tx_hash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
): AccountCToken {
  let cTokenStatsID = marketID.concat('-').concat(accountID)
  let cTokenStats = AccountCToken.load(cTokenStatsID)
  if (cTokenStats == null) {
    cTokenStats = createAccountCToken(cTokenStatsID, marketSymbol, accountID, marketID)
  }
  getOrCreateAccountCTokenTransaction(
    cTokenStatsID,
    tx_hash,
    timestamp,
    blockNumber,
    logIndex,
  )
  cTokenStats.accrualBlockNumber = blockNumber
  return cTokenStats as AccountCToken
}

export function updateCommonPoolStats(
  poolID: string,
  adminID: string,
  tx_hash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt
): AdminFusePool {
  let poolStatsID = poolID.concat('-').concat(adminID)
  let poolStats = AdminFusePool.load(poolStatsID)

  if (poolStats == null) {
    poolStats = createAdminFusePool(poolStatsID, adminID, poolID)
  }

  getOrCreateAdminFusePoolTransaction(
    poolStatsID,
    tx_hash,
    timestamp,
    blockNumber,
    logIndex
  )

  poolStats.accrualBlockNumber = blockNumber

  return poolStats as AdminFusePool
}

export function getOrCreateAccountCTokenTransaction(
  accountID: string,
  tx_hash: Bytes,
  timestamp: BigInt,
  block: BigInt,
  logIndex: BigInt,
): AccountCTokenTransaction {
  let id = accountID
    .concat('-')
    .concat(tx_hash.toHexString())
    .concat('-')
    .concat(logIndex.toString())
  let transaction = AccountCTokenTransaction.load(id)

  if (transaction == null) {
    transaction = new AccountCTokenTransaction(id)
    transaction.account = accountID
    transaction.tx_hash = tx_hash
    transaction.timestamp = timestamp
    transaction.block = block
    transaction.logIndex = logIndex
    transaction.save()
  }

  return transaction as AccountCTokenTransaction
}

export function getOrCreateAdminFusePoolTransaction(
  adminID: string,
  tx_hash: Bytes,
  timestamp: BigInt,
  block: BigInt,
  logIndex: BigInt,
): AdminFusePoolTransaction {
  let id = adminID
    .concat('-')
    .concat(tx_hash.toHexString())
    .concat('-')
    .concat(logIndex.toString())
  let transaction = AdminFusePoolTransaction.load(id)

  if (transaction == null) {
    transaction = new AdminFusePoolTransaction(id)
    transaction.admin = adminID
    transaction.tx_hash = tx_hash
    transaction.timestamp = timestamp
    transaction.block = block
    transaction.logIndex = logIndex

    transaction.save()
  }

  return transaction as AdminFusePoolTransaction
}
