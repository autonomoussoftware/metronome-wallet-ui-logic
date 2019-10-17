import BigNumber from 'bignumber.js'
import moment from 'moment'
import get from 'lodash/get'

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {boolean} True if the transaction is an Auction transaction
 */
function isAuctionTransaction(rawTx) {
  return get(rawTx.meta, 'metronome.auction', false)
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {boolean} True if the transaction is a Converter transaction
 */
function isConversionTransaction(rawTx) {
  return get(rawTx.meta, 'metronome.converter', false)
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @param {string} myAddress - The current wallet address
 * @returns {boolean} True if the transaction is a generic outgoing transaction
 */
function isSendTransaction({ transaction }, tokenData, myAddress) {
  return (
    (!tokenData && transaction.from && transaction.from === myAddress) ||
    (tokenData && tokenData.from && tokenData.from === myAddress) ||
    (tokenData && tokenData.processing && transaction.from === myAddress)
  )
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @param {string} myAddress - The current wallet address
 * @returns {boolean} True if the transaction is a generic incoming transaction
 */
function isReceiveTransaction({ transaction }, tokenData, myAddress) {
  return (
    (!tokenData && transaction.to && transaction.to === myAddress) ||
    (tokenData && tokenData.to && tokenData.to === myAddress)
  )
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {boolean} True if the transaction is an import request
 */
function isImportRequestTransaction(rawTx) {
  return get(rawTx.meta, 'metronome.importRequest', false)
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {boolean} True if the transaction is an attestation
 */
function isAttestation(rawTx) {
  return (
    get(rawTx.meta, 'metronome.attestation', false) &&
    !get(rawTx.meta, 'metronome.import', false)
  )
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {boolean} True if the transaction is an import
 */
function isImportTransaction(rawTx) {
  return get(rawTx.meta, 'metronome.import', false)
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {boolean} True if the transaction is an export
 */
function isExportTransaction(rawTx) {
  return get(rawTx.meta, 'metronome.export', false)
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @param {string} myAddress - The current wallet address
 * @returns {string} The wallet-usable transaction type or "unknown" if not recognized
 */
function getTxType(rawTx, tokenData, myAddress) {
  if (isAuctionTransaction(rawTx)) return 'auction'
  if (isConversionTransaction(rawTx)) return 'converted'
  if (isImportRequestTransaction(rawTx)) return 'import-requested'
  if (isImportTransaction(rawTx)) return 'imported'
  if (isExportTransaction(rawTx)) return 'exported'
  if (isAttestation(rawTx)) return 'attestation'
  if (isSendTransaction(rawTx, tokenData, myAddress)) return 'sent'
  if (isReceiveTransaction(rawTx, tokenData, myAddress)) return 'received'
  return 'unknown'
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @param {string} txType - The wallet-usable transaction type
 * @returns {string} The wallet-usable address the transaction comes from
 */
function getFrom(rawTx, tokenData, txType) {
  return txType === 'received' && tokenData && tokenData.from
    ? tokenData.from
    : rawTx.transaction.from
    ? rawTx.transaction.from
    : null
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @param {string} txType - The wallet-usable transaction type
 * @returns {string} The wallet-usable recipient address of the transaction
 */
function getTo(rawTx, tokenData, txType) {
  return txType === 'sent' && tokenData && tokenData.to
    ? tokenData.to
    : rawTx.transaction.to
    ? rawTx.transaction.to
    : null
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @param {string} txType - The wallet-usable transaction type
 * @returns {string} The wallet-usable transaction amount
 */
function getValue(rawTx, tokenData, txType) {
  return ['received', 'sent'].includes(txType) && tokenData && tokenData.value
    ? tokenData.value
    : txType === 'exported'
    ? get(rawTx, ['meta', 'metronome', 'export', 'value'], null)
    : txType === 'import-requested'
    ? get(rawTx, ['meta', 'metronome', 'importRequest', 'value'], null)
    : txType === 'imported'
    ? get(rawTx, ['meta', 'metronome', 'import', 'value'], null)
    : rawTx.transaction.value
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @param {string} txType - The wallet-usable transaction type
 * @returns {boolean} True if transaction is a valid attestation
 */
function getIsAttestationValid(rawTx, txType) {
  return txType === 'attestation' || txType === 'import'
    ? get(rawTx, ['meta', 'metronome', 'attestation', 'isValid'], false)
    : null
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @param {string} txType - The wallet-usable transaction type
 * @returns {string} The amount of coin spent in an Auction transaction
 */
function getCoinSpentInAuction(rawTx, txType) {
  return txType === 'auction' && rawTx.meta
    ? new BigNumber(rawTx.transaction.value)
        .minus(new BigNumber(rawTx.meta.returnedValue))
        .toString(10)
    : null
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @param {string} txType - The wallet-usable transaction type
 * @returns {string} The amount of MET bought in an Auction transaction
 */
function getMetBoughtInAuction(rawTx, tokenData, txType) {
  return txType === 'auction' && rawTx.transaction.blockHash && tokenData
    ? tokenData.value
    : null
}

/**
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @param {string} txType - The wallet-usable transaction type
 * @returns {string} The wallet-usable symbol to use together with the wallet-usable amount
 */
function getSymbol(tokenData, txType) {
  return ['received', 'sent'].includes(txType)
    ? tokenData
      ? 'MET'
      : 'coin'
    : null
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @param {string} txType - The wallet-usable transaction type
 * @returns {string} The wallet-usable symbol for the origin amount in a Convertion tx
 */
function getConvertedFrom(rawTx, txType) {
  return txType === 'converted'
    ? new BigNumber(rawTx.transaction.value).isZero()
      ? 'MET'
      : 'coin'
    : null
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @param {string} convertedFrom - The wallet-usable symbol of the origin amount
 * @returns {string} The wallet-usable origin amount in a Convertion tx
 */
function getFromValue(rawTx, tokenData, convertedFrom) {
  return convertedFrom
    ? convertedFrom === 'coin'
      ? rawTx.transaction.value
      : tokenData
      ? tokenData.value
      : null
    : null
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @param {string} convertedFrom - The wallet-usable symbol of the origin amount
 * @returns {string} The wallet-usable result amount in a Convertion tx
 */
function getToValue(rawTx, tokenData, convertedFrom) {
  return convertedFrom && tokenData && rawTx.meta
    ? convertedFrom === 'coin'
      ? tokenData.value
      : rawTx.meta.returnedValue
    : null
}

/**
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @returns {string} True if transaction is an Approval
 */
function getIsApproval(tokenData) {
  return (
    !!tokenData &&
    tokenData.event === 'Approval' &&
    !new BigNumber(tokenData.value).isZero()
  )
}

/**
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @returns {string} True if transaction is an Approval Cancelation
 */
function getIsCancelApproval(tokenData) {
  return (
    !!tokenData &&
    tokenData.event === 'Approval' &&
    new BigNumber(tokenData.value).isZero()
  )
}

/**
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @returns {string} The wallet-usable amount of an Approval transaction
 */
function getApprovedValue(tokenData) {
  return tokenData && tokenData.event === 'Approval' ? tokenData.value : null
}

/**
 * @param {Object} tokenData - The parsed Metronome metadata parsed from raw tx
 * @returns {boolean} True if transaction transaction metadata is still being gathered
 */
function getIsProcessing(tokenData) {
  return get(tokenData, 'processing', false)
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {boolean} True if the transaction is a failed contract call
 */
function getContractCallFailed(rawTx) {
  return get(rawTx, ['meta', 'contractCallFailed'], false)
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {string} The amount of gas used by the transaction
 */
function getGasUsed(rawTx) {
  return get(rawTx, ['receipt', 'gasUsed'], null)
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {string} The transaction hash
 */
function getTransactionHash(rawTx) {
  return get(rawTx, ['transaction', 'hash'], null)
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {number} The heigth of the block cointaining the transaction
 */
function getBlockNumber(rawTx) {
  return get(rawTx, ['transaction', 'blockNumber'], null)
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {string} The symbol of the origin chain on an import transaction
 */
function getImportedFrom(rawTx) {
  return (
    get(rawTx, ['meta', 'metronome', 'importRequest', 'originChain'], '') ||
    get(rawTx, ['meta', 'metronome', 'import', 'originChain'], '')
  )
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {string} The symbol of the target chain on an export transaction
 */
function getExportedTo(rawTx) {
  return get(rawTx, ['meta', 'metronome', 'export', 'destinationChain'], '')
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {string} The fee amount payed during a port operation
 */
function getPortFee(rawTx) {
  return (
    get(rawTx, ['meta', 'metronome', 'importRequest', 'fee'], null) ||
    get(rawTx, ['meta', 'metronome', 'import', 'fee'], null) ||
    get(rawTx, ['meta', 'metronome', 'export', 'fee'], null)
  )
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {string} The destination address of a port operation
 */
function getPortDestinationAddress(rawTx) {
  return (
    get(rawTx, ['meta', 'metronome', 'importRequest', 'to'], null) ||
    get(rawTx, ['meta', 'metronome', 'import', 'to'], null) ||
    get(rawTx, ['meta', 'metronome', 'export', 'to'], null)
  )
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {string} The port burn hash of a port operation
 */
function getPortBurnHash(rawTx) {
  return (
    get(rawTx, ['meta', 'metronome', 'export', 'currentBurnHash'], null) ||
    get(rawTx, ['meta', 'metronome', 'import', 'currentBurnHash'], null) ||
    get(rawTx, ['meta', 'metronome', 'attestation', 'currentBurnHash'], null) ||
    get(rawTx, ['meta', 'metronome', 'importRequest', 'currentBurnHash'], null)
  )
}

/**
 * @param {Object} rawTx - A raw (unparsed) transaction object
 * @returns {number} The block timestamp
 */
function getTimestamp(rawTx) {
  // TODO: in the future other transaction types will include a timestamp
  const timestamp = get(
    rawTx,
    ['meta', 'metronome', 'export', 'blockTimestamp'],
    null
  )
  return timestamp ? Number(timestamp) : null
}

/**
 * @param {number} timestamp - A block timestamp
 * @returns {string} A user-readable timestamp
 */
function getFormattedTime(timestamp) {
  return timestamp ? moment.unix(timestamp).format('LLLL') : null
}

export const createTransactionParser = myAddress => rawTx => {
  const tokenData = Object.values(rawTx.meta.tokens || {})[0] || null
  const txType = getTxType(rawTx, tokenData, myAddress)
  const convertedFrom = getConvertedFrom(rawTx, txType)
  const timestamp = getTimestamp(rawTx, txType)

  return {
    portDestinationAddress: getPortDestinationAddress(rawTx),
    metBoughtInAuction: getMetBoughtInAuction(rawTx, tokenData, txType),
    contractCallFailed: getContractCallFailed(rawTx),
    coinSpentInAuction: getCoinSpentInAuction(rawTx, txType),
    isAttestationValid: getIsAttestationValid(rawTx, txType),
    isCancelApproval: getIsCancelApproval(tokenData),
    approvedValue: getApprovedValue(tokenData),
    formattedTime: getFormattedTime(timestamp),
    convertedFrom,
    isProcessing: getIsProcessing(tokenData),
    portBurnHash: getPortBurnHash(rawTx),
    importedFrom: getImportedFrom(rawTx),
    blockNumber: getBlockNumber(rawTx),
    isApproval: getIsApproval(tokenData),
    exportedTo: getExportedTo(rawTx),
    fromValue: getFromValue(rawTx, tokenData, convertedFrom),
    timestamp,
    toValue: getToValue(rawTx, tokenData, convertedFrom),
    gasUsed: getGasUsed(rawTx),
    portFee: getPortFee(rawTx),
    txType,
    symbol: getSymbol(tokenData, txType),
    value: getValue(rawTx, tokenData, txType),
    from: getFrom(rawTx, tokenData, txType),
    hash: getTransactionHash(rawTx),
    meta: rawTx.meta,
    to: getTo(rawTx, tokenData, txType)
  }
}
