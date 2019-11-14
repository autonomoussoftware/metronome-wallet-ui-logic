import { sanitize } from './sanitizers'
import BigNumber from 'bignumber.js'

const format = {
  decimalSeparator: '.',
  groupSeparator: ',',
  groupSize: 3
}

BigNumber.config({ FORMAT: format })

/**
 * Given a coin amount, the current auction price and remaining tokens, returns
 * the expected MET amount, the coin spent, if the purchase depletes the auction
 * and a possible coin return for that purchase.
 *
 * @param {Object} params - Params required for the estimate
 * @param {string} params.remaining - The remaining tokens in current auction
 * @param {string} params.client - The client object
 * @param {string} params.amount - The user-provided amount (in ETH)
 * @param {string} params.rate - The current auction price
 *
 * @returns {Object} result - The purchase estimate
 * @returns {boolean} result.excedes - True if purchase will deplete the current auction
 * @returns {string} result.usedCoinAmount - The amount of coin effectively used in the purchase
 * @returns {string} result.excessCoinAmount - The amount of coin returned from purchase if auction was depleted
 */
export function getPurchaseEstimate({ remaining, client, amount, rate }) {
  // Auction price is expressed in wei (18 decimals) in every chain, so coin
  // values must be converted to 18 decimals for calculations disregarding
  // the chain decimals configuration value.
  let isValidAmount
  let weiAmount
  try {
    weiAmount = new BigNumber(client.toWei(sanitize(amount)))
    isValidAmount = weiAmount.gte(new BigNumber(0))
  } catch (e) {
    isValidAmount = false
  }

  const expectedMETamount = isValidAmount
    ? client.toWei(
        weiAmount
          .dividedBy(new BigNumber(rate))
          .decimalPlaces(18)
          .toString(10)
      )
    : null

  const excedes = isValidAmount
    ? client.toBN(expectedMETamount).gt(client.toBN(remaining))
    : null

  const usedCoinAmount =
    isValidAmount && excedes
      ? new BigNumber(remaining)
          .multipliedBy(new BigNumber(rate))
          .dividedBy(new BigNumber(client.toWei('1')))
          .decimalPlaces(0)
          .toString(10)
      : null

  const excessCoinAmount =
    isValidAmount && excedes
      ? weiAmount
          .minus(usedCoinAmount)
          .decimalPlaces(0)
          .toString()
      : null

  return { expectedMETamount, excedes, usedCoinAmount, excessCoinAmount }
}
