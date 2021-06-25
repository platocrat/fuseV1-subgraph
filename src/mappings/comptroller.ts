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
import { Market, Account, FusePool, ComptrollerAccount } from '../types/schema'
import {
  mantissaFactorBD,
  updateCommonCTokenStats,
  createAccount,
  createComptrollerAccount,
  updateCommonFusePoolStats
} from './helpers'
import { createMarket } from './markets'

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
  let comptrollerAddress = event.address
  let comptrollerID = comptrollerAddress.toHexString()
  let fusePool = FusePool.load(comptrollerID)

  if (fusePool != null) {
    let comptrollerID = event.address.toHex()
    let comptroller = ComptrollerAccount.load(comptrollerID)

    if (comptroller != null) {
      createComptrollerAccount(comptrollerID)
    }

    let fusePoolStats = updateCommonFusePoolStats(
      fusePool.id,
      fusePool.name,
      comptroller.id,
      event.transaction.hash,
      event.block.timestamp,
      event.block.number,
      event.logIndex
    )

    fusePoolStats.closeFactor = event.params.newCloseFactorMantissa

    fusePoolStats.save()
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
  let comptrollerAddress = event.address,
    comptrollerID = comptrollerAddress.toHexString(),
    fusePool = FusePool.load(comptrollerID)

  if (fusePool != null) {
    fusePool.liquidationIncentive = event.params.newLiquidationIncentiveMantissa
    fusePool.save()
  }
}

/** @todo Finish implementing these */
// export function handleNewPauseGuardian(event: NewPauseGuardian): void {
//   let comptrollerAddress = event.address,
//     comptrollerID = comptrollerAddress.toString(),
//     comptroller = FusePool.load(comptrollerID)

//   comptroller.newPauseGuardian = event.params.newPauseGuardian
//   comptroller.save()
// }

// export function handleNewBorrowCap(event: NewBorrowCap): void {
//   let comptrollerAddress = event.address,
//     comptrollerID = comptrollerAddress.toString(),
//     comptroller = FusePool.load(comptrollerID)

//   comptroller.newBorrowCap = event.params.newBorrowCap
//   comptroller.save()
// }

// export function handleNewBorrowCapGuardian(event: NewBorrowCapGuardian): void {
//   let comptrollerAddress = event.address,
//     comptrollerID = comptrollerAddress.toString(),
//     comptroller = FusePool.load(comptrollerID)

//   comptroller.newBorrowCapGuardian = event.params.newBorrowCapGuardian
//   comptroller.save()
// }

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let comptrollerAddress = event.address,
    comptrollerID = comptrollerAddress.toHexString(),
    fusePool = FusePool.load(comptrollerID)
  // This is the first event used in this mapping, so we use it to create the entity
  if (fusePool == null) {
    fusePool = FusePool.load(comptrollerID)
  }
  fusePool.priceOracle = event.params.newPriceOracle
  fusePool.save()
}