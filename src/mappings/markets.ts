/* eslint-disable prefer-const */ // to satisfy AS compiler

// For each division by 10, add one to exponent to truncate one significant figure
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { Market } from '../types/schema'
import { PriceOracle } from '../types/templates/CToken/PriceOracle'
import { MasterPriceOracle } from '../types/templates/CToken/MasterPriceOracle'
import { ERC20 } from '../types/templates/CToken/ERC20'
import { CToken } from '../types/templates/CToken/CToken'
import { Comptroller } from '../types/templates/Comptroller/Comptroller'

import {
  exponentToBigDecimal,
  mantissaFactor,
  mantissaFactorBD,
  cTokenDecimalsBD,
  zeroBD,
  convertMantissaToAPY,
  convertMantissaToAPR,
} from './helpers'
import { MarketListed } from '../types/Comptroller/Comptroller'

let cUSDCAddress = '0x39aa39c021dfbae8fac545936693ac917d5e7563'
let cETHAddress = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5'
let daiAddress = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'

// Used for all cERC20 contracts
function getTokenPrice(
  blockNumber: i32,
  eventAddress: Address,
  underlyingAddress: Address,
  underlyingDecimals: i32,
): BigDecimal {
  let oracleAddress = Address.fromString('0x1887118E49e0F4A78Bd71B792a49dE03504A764D')
  let underlyingPrice: BigDecimal
  let priceOracle1Address = Address.fromString('02557a5e05defeffd4cae6d83ea3d173b272c904')

  /* PriceOracle2 is used at the block the Comptroller starts using it.
   * see here https://etherscan.io/address/0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b#events
   * Search for event topic 0xd52b2b9b7e9ee655fcb95d2e5b9e0c9f69e7ef2b8e9d2d0ea78402d576d22e22,
   * and see block 7715908.
   *
   * This must use the cToken address.
   *
   * Note this returns the value without factoring in token decimals and wei, so we must divide
   * the number by (ethDecimals - tokenDecimals) and again by the mantissa.
   * USDC would be 10 ^ ((18 - 6) + 18) = 10 ^ 30
   *
   * Note that they deployed 3 different PriceOracles at the beginning of the Comptroller,
   * and that they handle the decimals different, which can break the subgraph. So we actually
   * defer to Oracle 1 before block 7715908, which works,
   * until this one is deployed, which was used for 121 days */
  if (blockNumber > 7715908) {
    let mantissaDecimalFactor = 18 - underlyingDecimals + 18
    let bdFactor = exponentToBigDecimal(mantissaDecimalFactor)
    let oracle2 = MasterPriceOracle.bind(oracleAddress)
    let tryUnderlyingPrice = oracle2.try_getUnderlyingPrice(eventAddress)

    tryUnderlyingPrice.reverted
      ? underlyingPrice = BigDecimal.fromString('0')
      : underlyingPrice = tryUnderlyingPrice.value
        .toBigDecimal()
        .div(bdFactor)

    /* PriceOracle(1) is used (only for the first ~100 blocks of Comptroller. Annoying but we must
     * handle this. We use it for more than 100 blocks, see reason at top of if statement
     * of PriceOracle2.
     *
     * This must use the token address, not the cToken address.
     *
     * Note this returns the value already factoring in token decimals and wei, therefore
     * we only need to divide by the mantissa, 10^18 */
  } else {
    let oracle1 = PriceOracle.bind(priceOracle1Address)
    let tryUnderlyingPrice = oracle1.try_getUnderlyingPrice(underlyingAddress)

    tryUnderlyingPrice.reverted
      ? underlyingPrice = BigDecimal.fromString('0')
      : underlyingPrice = tryUnderlyingPrice.value
        .toBigDecimal()
        .div(mantissaFactorBD)
  }
  return underlyingPrice
}

// Returns the price of USDC in eth. i.e. 0.005 would mean ETH is $200
function getUSDCpriceETH(blockNumber: i32): BigDecimal {
  let oracleAddress = Address.fromString('0x1887118E49e0F4A78Bd71B792a49dE03504A764D')
  let priceOracle1Address = Address.fromString('02557a5e05defeffd4cae6d83ea3d173b272c904')
  let USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 '
  let usdPrice: BigDecimal

  // See notes on block number if statement in getTokenPrices()
  if (blockNumber > 7715908) {
    let oracle2 = MasterPriceOracle.bind(oracleAddress)
    let mantissaDecimalFactorUSDC = 18 - 6 + 18
    let bdFactorUSDC = exponentToBigDecimal(mantissaDecimalFactorUSDC)
    let tryUnderlyingPrice = oracle2
      .try_getUnderlyingPrice(Address.fromString(cUSDCAddress))

    tryUnderlyingPrice.reverted
      ? usdPrice = BigDecimal.fromString('0')
      : usdPrice = tryUnderlyingPrice.value
        .toBigDecimal()
        .div(bdFactorUSDC)
  } else {
    let oracle1 = PriceOracle.bind(priceOracle1Address)
    let tryUnderlyingPrice = oracle1
      .try_getUnderlyingPrice(Address.fromString(USDCAddress))

    tryUnderlyingPrice.reverted
      ? usdPrice = BigDecimal.fromString('0')
      : usdPrice = tryUnderlyingPrice.value
        .toBigDecimal()
        .div(mantissaFactorBD)
  }
  return usdPrice
}

export function createMarket(
  marketAddress: string,
  marketListedEvent: MarketListed | null
): Market {
  let market: Market
  let contract = CToken.bind(Address.fromString(marketAddress))

  // It is CETH, which has a slightly different interface
  if (marketAddress == cETHAddress) {
    market = new Market(marketAddress)
    market.underlyingAddress = Address.fromString(
      '0x0000000000000000000000000000000000000000',
    )
    market.underlyingDecimals = 18
    market.underlyingPrice = BigDecimal.fromString('1')
    market.underlyingName = 'Ether'
    market.underlyingSymbol = 'ETH'
    market.underlyingPriceUSD = zeroBD
    market.pool = marketListedEvent.address.toHexString()
    // It is all other CERC20 contracts
  } else {
    market = new Market(marketAddress)
    market.underlyingAddress = contract.underlying()

    let underlyingContract = ERC20.bind(market.underlyingAddress as Address),
      _decimals = underlyingContract.try_decimals(),
      noDecimals = 0,
      _name = underlyingContract.try_name(),
      _symbol = underlyingContract.try_symbol()

    _decimals.reverted
      ? market.underlyingDecimals = noDecimals
      : market.underlyingDecimals = _decimals.value

    if (market.underlyingAddress.toHexString() != daiAddress) {
      _name.reverted
        ? market.underlyingName = "no name detected"
        : market.underlyingName = _name.value
      _symbol.reverted
        ? market.underlyingSymbol = "NONE"
        : market.underlyingSymbol = _symbol.value
    } else {
      market.underlyingName = 'Dai Stablecoin v1.0 (DAI)'
      market.underlyingSymbol = 'DAI'
    }
    market.underlyingPriceUSD = zeroBD
    market.underlyingPrice = zeroBD
    if (marketAddress == cUSDCAddress) {
      market.underlyingPriceUSD = BigDecimal.fromString('1')
    }

    market.pool = marketListedEvent.address.toHexString()
  }

  let interestRateModelAddress = contract.try_interestRateModel()
  let reserveFactor = contract.try_reserveFactorMantissa()

  market.borrowRate = zeroBD
  market.cash = zeroBD
  market.collateralFactor = zeroBD
  market.exchangeRate = zeroBD
  market.interestRateModelAddress = interestRateModelAddress.reverted
    ? Address.fromString('0x0000000000000000000000000000000000000000')
    : interestRateModelAddress.value

  market.name = contract.name()

  if (contract.name().includes('Ethereum')) market.underlyingName = 'Ethereum'

  market.reserves = zeroBD
  market.supplyRate = zeroBD
  market.supplyRateAPR = zeroBD
  market.supplyRateAPY = zeroBD
  market.symbol = contract.symbol()
  market.totalBorrows = zeroBD
  market.totalSupply = zeroBD

  market.accrualBlockNumber = 0
  market.blockTimestamp = 0
  market.borrowIndex = zeroBD
  market.reserveFactor = reserveFactor.reverted ? BigInt.fromI32(0) : reserveFactor.value

  market.pool = marketListedEvent.address.toHexString()

  return market
}

// Only to be used after block 10678764, since it's aimed to fix the change to USD based price oracle.
function getETHinUSD(blockNumber: i32): BigDecimal {
  let oracleAddress = Address.fromString('0x1887118E49e0F4A78Bd71B792a49dE03504A764D')
  let oracle = MasterPriceOracle.bind(oracleAddress)
  let ethPriceInUSD: BigDecimal
  let tryUnderlyingPrice = oracle
    .try_getUnderlyingPrice(Address.fromString(cETHAddress))

  tryUnderlyingPrice.reverted
    ? ethPriceInUSD = BigDecimal.fromString('0')
    : ethPriceInUSD = tryUnderlyingPrice.value
      .toBigDecimal()
      .div(mantissaFactorBD)

  return ethPriceInUSD
}

export function updateMarket(
  marketAddress: Address,
  blockNumber: i32,
  blockTimestamp: i32,
): Market {
  let marketID = marketAddress.toHexString()
  let market = Market.load(marketID)

  // Only updateMarket if it has not been updated this block
  if (market.accrualBlockNumber != blockNumber) {
    let contractAddress = Address.fromString(market.id)
    let contract = CToken.bind(contractAddress)

    market.pool = contract._address.toHexString()

    // After block 10678764 price is calculated based on USD instead of ETH
    if (blockNumber > 10678764) {
      let ethPriceInUSD = getETHinUSD(blockNumber)

      // if cETH, we only update USD price
      if (market.id == cETHAddress) {
        market.underlyingPriceUSD = ethPriceInUSD.truncate(market.underlyingDecimals)
      } else {
        let tokenPriceUSD = getTokenPrice(
          blockNumber,
          contractAddress,
          market.underlyingAddress as Address,
          market.underlyingDecimals,
        )

        ethPriceInUSD == BigDecimal.fromString('0')
          ? market.underlyingPrice = BigDecimal.fromString('0')
          : market.underlyingPrice = tokenPriceUSD
            .div(ethPriceInUSD)
            .truncate(market.underlyingDecimals)

        // if USDC, we only update ETH price
        if (market.id != cUSDCAddress) {
          market.underlyingPriceUSD = tokenPriceUSD.truncate(
            market.underlyingDecimals
          )
        }
      }
    } else {
      let usdPriceInEth = getUSDCpriceETH(blockNumber)

      // if cETH, we only update USD price
      if (market.id == cETHAddress) {
        market.underlyingPriceUSD = market.underlyingPrice
          .div(usdPriceInEth)
          .truncate(market.underlyingDecimals)
      } else {
        let tokenPriceEth = getTokenPrice(
          blockNumber,
          contractAddress,
          market.underlyingAddress as Address,
          market.underlyingDecimals,
        )
        market.underlyingPrice = tokenPriceEth.truncate(market.underlyingDecimals)
        // if USDC, we only update ETH price
        if (market.id != cUSDCAddress) {
          market.underlyingPriceUSD = market.underlyingPrice
            .div(usdPriceInEth)
            .truncate(market.underlyingDecimals)
        }
      }
    }

    market.accrualBlockNumber = contract.accrualBlockNumber().toI32()
    market.blockTimestamp = blockTimestamp
    market.totalSupply = contract
      .totalSupply()
      .toBigDecimal()
      .div(cTokenDecimalsBD)

    /* Exchange rate explanation
       In Practice
        - If you call the cDAI contract on etherscan it comes back (2.0 * 10^26)
        - If you call the cUSDC contract on etherscan it comes back (2.0 * 10^14)
        - The real value is ~0.02. So cDAI is off by 10^28, and cUSDC 10^16
       How to calculate for tokens with different decimals
        - Must div by tokenDecimals, 10^market.underlyingDecimals
        - Must multiply by ctokenDecimals, 10^8
        - Must div by mantissa, 10^18
     */
    market.exchangeRate = contract
      .exchangeRateStored()
      .toBigDecimal()
      .div(exponentToBigDecimal(market.underlyingDecimals))
      .times(cTokenDecimalsBD)
      .div(mantissaFactorBD)
      .truncate(mantissaFactor)
    market.borrowIndex = contract
      .borrowIndex()
      .toBigDecimal()
      .div(mantissaFactorBD)
      .truncate(mantissaFactor)

    market.reserves = contract
      .totalReserves()
      .toBigDecimal()
      .div(exponentToBigDecimal(market.underlyingDecimals))
      .truncate(market.underlyingDecimals)
    market.totalBorrows = contract
      .totalBorrows()
      .toBigDecimal()
      .div(exponentToBigDecimal(market.underlyingDecimals))
      .truncate(market.underlyingDecimals)
    market.cash = contract
      .getCash()
      .toBigDecimal()
      .div(exponentToBigDecimal(market.underlyingDecimals))
      .truncate(market.underlyingDecimals)

    // Must convert to BigDecimal, and remove 10^18 that is used for Exp in Compound Solidity
    market.borrowRate = contract
      .borrowRatePerBlock()
      .toBigDecimal()
      .times(BigDecimal.fromString('2102400'))
      .div(mantissaFactorBD)
      .truncate(mantissaFactor)

    // This fails on only the first call to cZRX. It is unclear why, but otherwise it works.
    // So we handle it like this.
    let supplyRatePerBlock = contract.try_supplyRatePerBlock()
    if (supplyRatePerBlock.reverted) {
      log.info('***CALL FAILED*** : cERC20 supplyRatePerBlock() reverted', [])
      market.supplyRate = zeroBD
    } else {
      market.supplyRate = supplyRatePerBlock.value
        .toBigDecimal()
        .times(BigDecimal.fromString('2102400'))
        .div(mantissaFactorBD)
        .truncate(mantissaFactor)

      market.supplyRateAPY = convertMantissaToAPY(supplyRatePerBlock.value, 365)
      market.supplyRateAPR = convertMantissaToAPR(supplyRatePerBlock.value)
    }

    market.save()
  }
  return market as Market
}
