/* eslint-disable prefer-const */ // to satisfy AS compiler

// For each division by 10, add one to exponent to truncate one significant figure
import { BigDecimal, BigInt, Bytes, Address } from '@graphprotocol/graph-ts'
import {
  AccountCToken,
  Account,
  AccountCTokenTransaction,
  ComptrollerAccount,
  ComptrollerAccountFusePool,
  ComptrollerAccountFusePoolTransaction
} from '../types/schema'

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
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

export function createComptrollerAccountFusePool(
  fusePoolStatsID: string,
  poolName: string,
  comptrollerAccount: string,
  fusePoolID: string,
): ComptrollerAccountFusePool {
  let fusePoolStats = new ComptrollerAccountFusePool(fusePoolStatsID)
  fusePoolStats.name = poolName
  fusePoolStats.pool = fusePoolID
  fusePoolStats.comptrollerAccount = comptrollerAccount
  fusePoolStats.accrualBlockNumber = BigInt.fromI32(0)
  fusePoolStats.priceOracle = Address.fromString('0x0000000000000000000000000000000000000000')
  fusePoolStats.closeFactor = BigInt.fromI32(0)
  fusePoolStats.liquidationIncentive = BigInt.fromI32(0)
  fusePoolStats.maxAssets = BigInt.fromI32(0)

  return fusePoolStats
}

export function createAccount(accountID: string): Account {
  let account = new Account(accountID)
  account.countLiquidated = 0
  account.countLiquidator = 0
  account.hasBorrowed = false
  account.save()
  return account
}

export function createComptrollerAccount(comptrollerAccountID: string): ComptrollerAccount {
  let comptrollerAccount = new ComptrollerAccount(comptrollerAccountID)

  comptrollerAccount.priceOracle = Address.fromString('0x0000000000000000000000000000000000000000')
  comptrollerAccount.closeFactor = new BigInt(9)
  comptrollerAccount.liquidationIncentive = new BigInt(9)
  comptrollerAccount.maxAssets = new BigInt(9)

  comptrollerAccount.save()

  return comptrollerAccount
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

export function updateCommonFusePoolStats(
  poolID: string,
  poolName: string,
  comptrollerAccountID: string,
  tx_hash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt
): ComptrollerAccountFusePool {
  let fusePoolStatsID = poolID.concat('-').concat(comptrollerAccountID)
  let fusePoolStats = ComptrollerAccountFusePool.load(fusePoolStatsID)

  if (fusePoolStats == null) {
    fusePoolStats = createComptrollerAccountFusePool(fusePoolStatsID, poolName, comptrollerAccountID, poolID)
  }

  getOrCreateComptrollerAccountFusePoolTransaction(
    fusePoolStatsID,
    tx_hash,
    timestamp,
    blockNumber,
    logIndex
  )

  fusePoolStats.accrualBlockNumber = blockNumber

  return fusePoolStats as ComptrollerAccountFusePool
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

export function getOrCreateComptrollerAccountFusePoolTransaction(
  comptrollerAccountID: string,
  tx_hash: Bytes,
  timestamp: BigInt,
  block: BigInt,
  logIndex: BigInt,
): ComptrollerAccountFusePoolTransaction {
  let id = comptrollerAccountID
    .concat('-')
    .concat(tx_hash.toHexString())
    .concat('-')
    .concat(logIndex.toString())
  let transaction = ComptrollerAccountFusePoolTransaction.load(id)

  if (transaction == null) {
    transaction = new ComptrollerAccountFusePoolTransaction(id)
    transaction.comptrollerAccount = comptrollerAccountID
    transaction.tx_hash = tx_hash
    transaction.timestamp = timestamp
    transaction.block = block
    transaction.logIndex = logIndex

    transaction.save()
  }

  return transaction as ComptrollerAccountFusePoolTransaction
}
