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
import { Comptroller } from '../types/templates/Comptroller/Comptroller'

export const secondsInFourDays = 4 * 60 * 24
export const apr = 2372500

/* New variables added for Fuse pool */
export let fixed18 = BigInt.fromI32(10).pow(18)
export let fixed16 = BigInt.fromI32(10).pow(16)
export let fixed36 = BigInt.fromI32(10).pow(36)
export let aprBI = BigInt.fromI32(apr)
export let oneBI = BigInt.fromI32(1)
export let secondsInFourDaysBI = BigInt.fromI32(secondsInFourDays)

/* Pre-existing variables from Compound */
export let mantissaFactor = 18
export let cTokenDecimals = 8
export let mantissaFactorBD: BigDecimal = exponentToBigDecimal(18)
export let cTokenDecimalsBD: BigDecimal = exponentToBigDecimal(8)
export let zeroBD = BigDecimal.fromString('0')

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function convertMantissaToAPY(mantissa: BigInt, dayRange: number): BigInt {
  let base = mantissa
    .div(fixed18)
    .times(secondsInFourDaysBI)
    .plus(oneBI)

  let exp = dayRange

  return base
    .pow(5).pow(73)
    .minus(oneBI)
    .times(BigInt.fromI32(100))
  // return (Math.pow((mantissa / 1e18) * (4 * 60 * 24) + 1, dayRange) - 1) * 100;
}

export function convertMantissaToAPR(mantissa: BigInt): BigInt {
  let numerator: BigInt = mantissa.times(aprBI)
  let denominator = fixed16

  return numerator
    .div(denominator)
  // return (mantissa.toI32() * 2372500) / 1e16;
}

// export function getTotalSupplyUSDInPool(_contract: Comptroller): BigDecimal {
//   let totalSupplyUSDInPool: BigDecimal = BigDecimal.fromString('0'),
//     contract = Pool.load(_contract._address.toHexString()),
//     allMarketsInPool: Address[] = _contract.getAllMarkets()

//   let assetAddress: Address,
//     asset: Market | null,
//     assetTotalSupplyUSD: BigDecimal

//   // allMarketsInPool = getAllMarketsInPool(_contract)
//   for (let i = 0; allMarketsInPool.length; i++) {
//     assetAddress = allMarketsInPool[i]
//     asset = Market.load(assetAddress.toHexString())
//     assetTotalSupplyUSD = asset.totalSupplyUSD
//     // let assetTotalSupplyUSD = BigDecimal.fromString('1')

//     totalSupplyUSDInPool.plus(assetTotalSupplyUSD)
//   }

//   return totalSupplyUSDInPool
// }

// export function getTotalBorrowUSDInPool(_contract: Comptroller): BigDecimal {
//   let totalBorrowUSDInPool: BigDecimal = BigDecimal.fromString('0'),
//     contract = Pool.load(_contract._address.toHexString()),
//     allMarketsInPool: Address[] = _contract.getAllMarkets()

//   let assetAddress: Address,
//     asset: Market | null,
//     assetTotalBorrowUSD: BigDecimal

//   for (let i = 0; allMarketsInPool.length; i++) {
//     assetAddress = allMarketsInPool[i]
//     asset = Market.load(assetAddress.toHexString())
//     assetTotalBorrowUSD = asset.totalBorrowUSD
//     // let assetTotalBorrowUSD = BigDecimal.fromString('1')

//     totalBorrowUSDInPool.plus(assetTotalBorrowUSD)
//   }

//   return totalBorrowUSDInPool
// }

export function getAllMarketsInPool(_contract: Comptroller): string[] {
  let allMarketsInPool_ = _contract.getAllMarkets()
  let allMarketsInPool: string[] = []

  for (let i = 0; i < allMarketsInPool_.length; i++) {
    allMarketsInPool.push(allMarketsInPool_[i].toHexString())
  }

  return allMarketsInPool
}

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
