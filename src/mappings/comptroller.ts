/* eslint-disable prefer-const */ // to satisfy AS compiler

import {
  MarketEntered,
  MarketExited,
  NewCloseFactor,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewBorrowCap, // not implemented
  NewBorrowCapGuardian, // not implemented
  NewPauseGuardian, // not implemented
  NewPriceOracle,
  MarketListed
} from '../types/Comptroller/Comptroller'

import { CToken } from '../types/templates'
import { Market, Account, Pool, Admin } from '../types/schema'
import {
  mantissaFactorBD,
  updateCommonCTokenStats,
  createAccount,
  createAdmin,
  updateCommonPoolStats
} from './helpers'
import { createMarket, updateMarket } from './markets'
import { updatePool } from './fusePools'

export function handleMarketListed(event: MarketListed): void {
  // Dynamically index all new listed tokens
  CToken.create(event.params.cToken)
  // Create the market for this token, since it's now been listed.
  let market = createMarket(event.params.cToken.toHexString())
  market.save()
}

export function handleMarketEntered(event: MarketEntered): void {
  let market = Market.load(event.params.cToken.toHexString())
  // Null check needed to avoid crashing on a new market added. Ideally when dynamic data
  // sources can source from the contract creation block and not the time the
  // comptroller adds the market, we can avoid this altogether
  if (market != null) {
    let accountID = event.params.account.toHex()
    let account = Account.load(accountID)
    if (account == null) {
      createAccount(accountID)
    }

    let cTokenStats = updateCommonCTokenStats(
      market.id,
      market.symbol,
      accountID,
      event.transaction.hash,
      event.block.timestamp,
      event.block.number,
      event.logIndex,
    )
    cTokenStats.enteredMarket = true
    cTokenStats.save()
  }
}

export function handleMarketExited(event: MarketExited): void {
  let market = Market.load(event.params.cToken.toHexString())
  // Null check needed to avoid crashing on a new market added. Ideally when dynamic data
  // sources can source from the contract creation block and not the time the
  // comptroller adds the market, we can avoid this altogether
  if (market != null) {
    let accountID = event.params.account.toHex()
    let account = Account.load(accountID)
    if (account == null) {
      createAccount(accountID)
    }

    let cTokenStats = updateCommonCTokenStats(
      market.id,
      market.symbol,
      accountID,
      event.transaction.hash,
      event.block.timestamp,
      event.block.number,
      event.logIndex,
    )
    cTokenStats.enteredMarket = false
    cTokenStats.save()
  }
}

export function handleNewCloseFactor(event: NewCloseFactor): void {
  let poolID = event.address.toHexString()
  let pool = Pool.load(poolID)

  if (pool != null) {
    pool = updatePool(event.address)

    let poolStats = updateCommonPoolStats(
      pool.id,
      pool.id,
      event.transaction.hash,
      event.block.timestamp,
      event.block.number,
      event.logIndex
    )

    pool.closeFactor = event.params.newCloseFactorMantissa
    pool.name = pool.name
    poolStats.closeFactor = event.params.newCloseFactorMantissa
    poolStats.name = pool.name

    pool.save()
    poolStats.save()
  }
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let market = Market.load(event.params.cToken.toHexString())
  // Null check needed to avoid crashing on a new market added. Ideally when dynamic data
  // sources can source from the contract creation block and not the time the
  // comptroller adds the market, we can avoid this altogether
  if (market != null) {
    market.collateralFactor = event.params.newCollateralFactorMantissa
      .toBigDecimal()
      .div(mantissaFactorBD)
    market.save()
  }
}

// This should be the first event according to etherscan but it isn't.... price oracle is. weird
export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  let poolID = event.address.toHexString(),
    pool = Pool.load(poolID)

  if (pool != null) {
    pool = updatePool(event.address)

    let poolStats = updateCommonPoolStats(
      pool.id,
      pool.id,
      event.transaction.hash,
      event.block.timestamp,
      event.block.number,
      event.logIndex
    )

    pool.liquidationIncentive = event.params.newLiquidationIncentiveMantissa
    poolStats.liquidationIncentive = event.params.newLiquidationIncentiveMantissa

    pool.save()
    poolStats.save()
  }
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let poolAddress = event.address,
    poolID = poolAddress.toHexString(),
    pool = Pool.load(poolID)

  // This is the first event used in this mapping, so we use it to create the entity
  if (pool == null) {
    pool = new Pool(poolID)
  } else {
    let poolStats = updateCommonPoolStats(
      pool.id,
      pool.id,
      event.transaction.hash,
      event.block.timestamp,
      event.block.number,
      event.logIndex
    )

    poolStats.priceOracle = event.params.newPriceOracle
    poolStats.save()
  }
  pool.priceOracle = event.params.newPriceOracle
  pool.save()
}