import BigNumber from 'bignumber.js'
import PropTypes from 'prop-types'

import { sanitize } from './sanitizers'

export { sanitizeMnemonic, sanitizeInput, sanitize } from './sanitizers'
export { createTransactionParser } from './createTransactionParser'
export { getAmountFieldsProps } from './getAmountFieldsProps'
export { getPurchaseEstimate } from './getPurchaseEstimate'
export { getConversionRate } from './getConversionRate'
export { mnemonicWords } from './mnemonicWords'
export { syncAmounts } from './syncAmounts'

/**
 * @param {string} value - The input value to validate
 * @returns {boolean} True if value is greater than 0
 */
export function hasFunds(value) {
  return value && new BigNumber(value).gt(new BigNumber(0))
}

/**
 * @param {Object} config - The active chain config object
 * @param {Object} client - A wallet client object
 * @param {string} amount - The input value to validate
 * @param {string} unit - The unit the input value is in
 *
 * @returns {boolean} True if value can be converted to wei
 */
export function isWeiable(config, client, amount, unit = 'ether') {
  let isValid
  try {
    client.fromCoin(config, sanitize(amount), unit)
    isValid = true
  } catch (e) {
    isValid = false
  }
  return isValid
}

/**
 * @param {Object} client - A wallet client object
 * @param {string} amount - The input value to validate
 *
 * @returns {boolean} True if value can be converted to hexadecimal
 */
export function isHexable(client, amount) {
  let isValid
  try {
    client.toHex(amount)
    isValid = true
  } catch (e) {
    isValid = false
  }
  return isValid
}

/**
 * @param {Object} client - A wallet client object
 * @param {string} amount - The input value to validate (will be converted to wei)
 *
 * @returns {boolean} True if value is greater than zero
 */
export function isGreaterThanZero(client, amount) {
  const weiAmount = client.toBN(client.toWei(sanitize(amount)))
  return weiAmount.gt(client.toBN(0))
}

/**
 * @param {Object} tx - A parsed transaction object
 * @param {number} confirmations - The amount of confirmations the transaction has
 *
 * @returns {boolean} True if transaction is failed
 */
export function isFailed(tx, confirmations) {
  return (
    (tx.txType === 'auction' && !tx.metBoughtInAuction && confirmations > 0) ||
    tx.contractCallFailed
  )
}

/**
 * @param {Object} tx - A parsed transaction object
 * @param {number} confirmations - The amount of confirmations the transaction has
 *
 * @returns {boolean} True if transaction is pending
 */
export function isPending(tx, confirmations) {
  return !isFailed(tx, confirmations) && confirmations < 6
}

export const errorPropTypes = (...fields) => {
  const shape = fields.reduce((acc, fieldName) => {
    acc[fieldName] = PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.string
    ])
    return acc
  }, {})
  return PropTypes.shape(shape).isRequired
}

export const statusPropTypes = PropTypes.oneOf([
  'init',
  'pending',
  'success',
  'failure'
]).isRequired
