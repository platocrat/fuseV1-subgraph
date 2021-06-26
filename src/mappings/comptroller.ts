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
  let poolAddress = event.address
  let poolID = poolAddress.toHexString()
  let pool = Pool.load(poolID)

  if (pool != null) {
    let poolID = event.address.toHex()
    let pool = Admin.load(poolID)

    if (pool != null) {
      createAdmin(poolID)
    }

    let poolStats = updateCommonPoolStats(
      pool.id,
      pool.id,
      event.transaction.hash,
      event.block.timestamp,
      event.block.number,
      event.logIndex
    )

    poolStats.closeFactor = event.params.newCloseFactorMantissa
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
  let poolAddress = event.address,
    poolID = poolAddress.toHexString(),
    pool = Pool.load(poolID)

  if (pool != null) {
    pool.liquidationIncentive = event.params.newLiquidationIncentiveMantissa
    pool.save()
  }
}

/** @todo Finish implementing these */
// export function handleNewPauseGuardian(event: NewPauseGuardian): void {
//   let poolAddress = event.address,
//     poolID = poolAddress.toString(),
//     pool = Pool.load(poolID)

//   pool.newPauseGuardian = event.params.newPauseGuardian
//   pool.save()
// }

// export function handleNewBorrowCap(event: NewBorrowCap): void {
//   let poolAddress = event.address,
//     poolID = poolAddress.toString(),
//     pool = Pool.load(poolID)

//   pool.newBorrowCap = event.params.newBorrowCap
//   pool.save()
// }

// export function handleNewBorrowCapGuardian(event: NewBorrowCapGuardian): void {
//   let poolAddress = event.address,
//     poolID = poolAddress.toString(),
//     pool = Pool.load(poolID)

//   pool.newBorrowCapGuardian = event.params.newBorrowCapGuardian
//   pool.save()
// }

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let poolAddress = event.address,
    poolID = poolAddress.toHexString(),
    pool = Pool.load(poolID)

  // This is the first event used in this mapping, so we use it to create the entity
  if (pool == null) {
    pool = Pool.load(poolID)
  }
  pool.priceOracle = event.params.newPriceOracle
  pool.save()
}