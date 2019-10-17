/* eslint-disable max-params */
import { isWeiable, isHexable, sanitize, sanitizeMnemonic } from './utils'

/**
 * Validates a generic "amount" field
 *
 * @param {Object} client - A wallet client object
 * @param {string} amount - The input value to validate
 * @param {string} propName - Property name to use in the errors map
 * @param {string} max - Wallet balance used to validate amount maximmum
 * @param {Object} errors - A map of errors (from other validators)
 *
 * @returns {Object} A mutated map of errors
 */
function validateAmount(client, amount, propName, max, errors = {}) {
  if (!amount) {
    errors[propName] = 'Amount is required'
  } else if (!isWeiable(client, amount)) {
    errors[propName] = 'Invalid amount'
  } else if (max && parseFloat(amount) > parseFloat(max)) {
    errors[propName] = 'Insufficient funds'
  } else if (parseFloat(amount) < 0) {
    errors[propName] = 'Amount must be greater than 0'
  }
  return errors
}

/**
 * Validates "coin amount" fields
 *
 * @param {Object} client - A wallet client object
 * @param {string} coinAmount - The input value to validate
 * @param {string} max - Wallet coin balance used to validate amount maximmum
 * @param {Object} errors - A map of errors (from other validators)
 *
 * @returns {Object} A mutated map of errors
 */
export function validateCoinAmount(client, coinAmount, max, errors = {}) {
  return validateAmount(client, coinAmount, 'coinAmount', max, errors)
}

/**
 * Validates "MET amount" fields
 *
 * @param {Object} client - A wallet client object
 * @param {string} metAmount - The input value to validate
 * @param {string} max - Wallet coin balance used to validate amount maximmum
 * @param {Object} errors - A map of errors (from other validators)
 *
 * @returns {Object} A mutated map of errors
 */
export function validateMetAmount(client, metAmount, max, errors = {}) {
  return validateAmount(client, metAmount, 'metAmount', max, errors)
}

/**
 * Validates "address" fields
 *
 * @param {Object} client - A wallet client object
 * @param {string} toAddress - The input value to validate
 * @param {Object} errors - A map of errors (from other validators)
 *
 * @returns {Object} A mutated map of errors
 */
export function validateToAddress(client, toAddress, errors = {}) {
  if (!toAddress) {
    errors.toAddress = 'Address is required'
  } else if (!client.isAddress(toAddress)) {
    errors.toAddress = 'Invalid address'
  }
  return errors
}

/**
 * Validates "Gas Limit" fields
 *
 * @param {Object} client - A wallet client object
 * @param {string} gasLimit - The input value to validate
 * @param {string} min - A minimmum valid value for gas limit
 * @param {Object} errors - A map of errors (from other validators)
 *
 * @returns {Object} A mutated map of errors
 */
export function validateGasLimit(client, gasLimit, min, errors = {}) {
  const value = parseFloat(sanitize(gasLimit), 10)

  if (gasLimit === null || gasLimit === '') {
    errors.gasLimit = 'Gas limit is required'
  } else if (Number.isNaN(value)) {
    errors.gasLimit = 'Invalid value'
  } else if (Math.floor(value) !== value) {
    errors.gasLimit = 'Gas limit must be an integer'
  } else if (value <= 0) {
    errors.gasLimit = 'Gas limit must be greater than 0'
  } else if (!isHexable(client, value)) {
    errors.gasLimit = 'Invalid value'
  }
  return errors
}

/**
 * Validates "Gas Price" fields
 *
 * @param {Object} client - A wallet client object
 * @param {string} gasPrice - The input value to validate
 * @param {Object} errors - A map of errors (from other validators)
 *
 * @returns {Object} A mutated map of errors
 */
export function validateGasPrice(client, gasPrice, errors = {}) {
  const value = parseFloat(sanitize(gasPrice), 10)

  if (gasPrice === null || gasPrice === '') {
    errors.gasPrice = 'Gas price is required'
  } else if (Number.isNaN(value)) {
    errors.gasPrice = 'Invalid value'
  } else if (value <= 0) {
    errors.gasPrice = 'Gas price must be greater than 0'
  } else if (!isWeiable(client, gasPrice, 'gwei')) {
    errors.gasPrice = 'Invalid value'
  } else if (!isHexable(client, client.toWei(gasPrice, 'gwei'))) {
    errors.gasPrice = 'Invalid value'
  }
  return errors
}

/**
 * Validates "12 word mnemonic" fields
 *
 * @param {Object} client - A wallet client object
 * @param {string} mnemonic - The input value to validate
 * @param {string} propName - Property name to use in the errors map
 * @param {Object} errors - A map of errors (from other validators)
 *
 * @returns {Object} A mutated map of errors
 */
export function validateMnemonic(
  client,
  mnemonic,
  propName = 'mnemonic',
  errors = {}
) {
  if (!mnemonic) {
    errors[propName] = 'The phrase is required'
  } else if (!client.isValidMnemonic(sanitizeMnemonic(mnemonic))) {
    errors[propName] = "These words don't look like a valid recovery phrase"
  }
  return errors
}

/**
 * Validates "Repeat mnemonic mnemonic" fields
 *
 * @param {Object} client - A wallet client object
 * @param {string} mnemonic - The original mnemonic
 * @param {string} mnemonicAgain - The input value to validate
 * @param {string} propName - Property name to use in the errors map
 * @param {Object} errors - A map of errors (from other validators)
 *
 * @returns {Object} A mutated map of errors
 */
export function validateMnemonicAgain(
  client,
  mnemonic,
  mnemonicAgain,
  propName = 'mnemonicAgain',
  errors = {}
) {
  if (!mnemonicAgain) {
    errors[propName] = 'The phrase is required'
  } else if (!client.isValidMnemonic(sanitizeMnemonic(mnemonicAgain))) {
    errors[propName] = "These words don't look like a valid recovery phrase"
  } else if (sanitizeMnemonic(mnemonicAgain) !== mnemonic) {
    errors[propName] =
      'The text provided does not match your recovery passphrase.'
  }
  return errors
}

/**
 * Validates "Password" fields
 *
 * @param {string} password - The input value to validate
 * @param {Object} errors - A map of errors (from other validators)
 *
 * @returns {Object} A mutated map of errors
 */
export function validatePassword(password, errors = {}) {
  if (!password) {
    errors.password = 'Password is required'
  }
  return errors
}

/**
 * Validates "Create Password" fields
 *
 * @param {Object} client - A wallet client object
 * @param {Object} config - A wallet config object
 * @param {string} password - The input value to validate
 * @param {Object} errors - A map of errors (from other validators)
 *
 * @returns {Object} A mutated map of errors
 */
export function validatePasswordCreation(
  client,
  config,
  password,
  errors = {}
) {
  if (!password) {
    errors.password = 'Password is required'
  } else if (
    client.getStringEntropy(password) < config.requiredPasswordEntropy
  ) {
    errors.password = 'Password is not strong enough'
  }

  return errors
}

/**
 * Validates "Use minimum" fields fon Converter forms
 *
 * @param {boolean} useMinimum - The input value to validate
 * @param {string} estimate - The conversion estimate
 * @param {Object} errors - A map of errors (from other validators)
 *
 * @returns {Object} A mutated map of errors
 */
export function validateUseMinimum(useMinimum, estimate, errors = {}) {
  if (useMinimum && !estimate) {
    errors.useMinimum = 'No estimated return. Try again.'
  }
  return errors
}
