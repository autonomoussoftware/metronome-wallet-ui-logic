import { createSelector } from 'reselect'
import * as utils from '../utils'
import sortBy from 'lodash/sortBy'
import get from 'lodash/get'

// Returns the "chains" state branch
export const getChains = state => state.chains

// Returns the id of the active chain
export const getActiveChain = createSelector(getChains, chains => chains.active)

// Returns all the data related to the active chain
export const getActiveChainData = createSelector(
  getActiveChain,
  getChains,
  (active, chains) => chains.byId[active]
)

// Returns the client (useful for accessing helpers inside other selectors)
export const getClient = (props, client) => client

// Returns the "config" state branch
export const getConfig = state => state.config

// Returns the "connectivity" state branch
export const getConnectivity = state => state.connectivity

// Returns if the wallet is online or not (check reducer to see conditions)
export const getIsOnline = createSelector(
  getConnectivity,
  connectivityStatus => connectivityStatus.isOnline
)

// Returns if user is logged id or not
export const getIsLoggedIn = state => state.session.isLoggedIn

// Returns if session is active or not
// Possible improvements: expire session after timeout
export const isSessionActive = getIsLoggedIn

// Returns all user wallets
const getWalletsById = createSelector(
  getActiveChainData,
  chainData => chainData.wallets.byId
)

// Returns thw active wallet id
const getActiveWalletId = createSelector(
  getActiveChainData,
  chainData => chainData.wallets.active
)

// Returns all the data of the active wallet
const getActiveWalletData = createSelector(
  getActiveWalletId,
  getWalletsById,
  (activeId, walletsById) => get(walletsById, activeId, null)
)

// Returns all the addresses of the active wallet
const getActiveWalletAddresses = createSelector(
  getActiveWalletData,
  activeWallet =>
    get(activeWallet, 'addresses', null)
      ? Object.keys(activeWallet.addresses)
      : null
)

// Returns the active address
export const getActiveAddress = createSelector(
  getActiveWalletAddresses,
  addresses => get(addresses, 0, null)
)

// Returns all the data related to the active address
const getActiveAddressData = createSelector(
  getActiveWalletData,
  getActiveAddress,
  (activeWallet, activeAddress) =>
    get(activeWallet, ['addresses', activeAddress], null)
)

// Returns the current coin balance of the active address in wei
export const getActiveWalletCoinBalance = createSelector(
  getActiveAddressData,
  activeAddressData => get(activeAddressData, 'balance', null)
)

// Returns the MET balance of the active address in wei
export const getActiveWalletMetBalance = createSelector(
  getActiveAddressData,
  getConfig,
  (activeAddressData, config) =>
    get(activeAddressData, ['token', config.MET_TOKEN_ADDR, 'balance'], null)
)

// Returns the current coin rate
export const getCoinRate = createSelector(
  getActiveChainData,
  chainData => chainData.meta.rate
)

// Returns the current coin balance of the active address in wei
export const getCoinBalanceWei = getActiveWalletCoinBalance

// Returns the MET balance of the active address in wei
export const getMetBalanceWei = getActiveWalletMetBalance

// TODO implement when we have a definition about MET:USD rate
export const getMetBalanceUSD = () => '0'

// Returns the current coin balance of the active address in USD
export const getCoinBalanceUSD = createSelector(
  getActiveWalletCoinBalance,
  getCoinRate,
  getClient,
  (balance, coinRate, client) => {
    if (!balance || !coinRate) return '0'
    const usdValue = parseFloat(client.fromWei(balance)) * coinRate
    return usdValue.toFixed(2)
  }
)

// Returns the "auction" state branch for the active chain
export const getAuction = createSelector(
  getActiveChainData,
  activeChain => activeChain.auction
)

// Returns the auction status on the active chain
export const getAuctionStatus = createSelector(
  getAuction,
  auction => auction.status
)

// Returns the auction number on the active chain
export const getCurrentAuction = createSelector(
  getAuctionStatus,
  auctionStatus =>
    auctionStatus && auctionStatus.currentAuction
      ? auctionStatus.currentAuction
      : '-1'
)

// Returns the auction price on the active chain (in USD)
export const getAuctionPriceUSD = createSelector(
  getAuctionStatus,
  getCoinRate,
  getClient,
  (auctionStatus, coinRate, client) => {
    if (!auctionStatus || !coinRate) return '0'
    const usdValue =
      parseFloat(client.fromWei(auctionStatus.currentPrice)) * coinRate
    return usdValue.toFixed(2)
  }
)

// Returns the "converter" state branch for the active chain
export const getConverter = createSelector(
  getActiveChainData,
  activeChain => activeChain.converter
)

// Returns the converter status on the active chain
export const getConverterStatus = createSelector(
  getConverter,
  converter => converter.status
)

// Returns the auction price on the active chain
export const getConverterPrice = createSelector(
  getConverterStatus,
  converterStatus => get(converterStatus, 'currentPrice', null)
)

// Returns the converter price on the active chain (in USD)
export const getConverterPriceUSD = createSelector(
  getConverterStatus,
  getCoinRate,
  getClient,
  (converterStatus, coinRate, client) => {
    if (!converterStatus || !coinRate) return '0'
    const usdValue =
      parseFloat(client.fromWei(converterStatus.currentPrice)) * coinRate
    return usdValue.toFixed(2)
  }
)

// Returns the active chain "meta" state branch
export const getChainMeta = createSelector(
  getActiveChainData,
  activeChain => activeChain.meta
)

// Returns the active chain height
export const getBlockHeight = createSelector(
  getChainMeta,
  chainMeta => chainMeta.height
)

// Returns the active chain current gas price
export const getChainGasPrice = createSelector(
  getChainMeta,
  getConfig,
  (chainMeta, config) => chainMeta.gasPrice || config.DEFAULT_GAS_PRICE
)

// Returns the amount of confirmations for a given transaction
export const getTxConfirmations = createSelector(
  getBlockHeight,
  (state, props) => props.tx.blockNumber,
  (blockHeight, txBlockNumber) =>
    txBlockNumber === null || txBlockNumber > blockHeight
      ? 0
      : blockHeight - txBlockNumber + 1
)

// Returns the array of transactions of the current chain/wallet/address.
// The items are mapped to contain properties useful for rendering.
export const getActiveWalletTransactions = createSelector(
  getActiveAddressData,
  getActiveAddress,
  (activeAddressData, activeAddress) => {
    const transactionParser = utils.createTransactionParser(activeAddress)

    const transactions = get(activeAddressData, 'transactions', [])

    return sortBy(transactions, [
      'transaction.blockNumber',
      'transaction.transactionIndex',
      'transaction.nonce'
    ])
      .reverse()
      .map(transactionParser)
  }
)

// Returns if the current wallet/address has transactions on the active chain
export const hasTransactions = createSelector(
  getActiveWalletTransactions,
  transactions => transactions.length > 0
)

// Returns if wallet is scanning transactions on the active chain
// export const getIsScanningTx = state => state.wallets.isScanningTx
export const getIsScanningTx = createSelector(
  getActiveChainData,
  chainData => chainData.wallets.isScanningTx
)

// Returns a transaction object given a transaction hash
export const getTransactionFromHash = createSelector(
  getActiveWalletTransactions,
  (state, props) => props.hash,
  (transactions, hash) => transactions.find(tx => tx.hash === hash)
)

// Returns if renderer has enough data to load the wallet UI.
// Renderer will display the "Gathering data..." screen until it does.
export const hasEnoughData = state => state.session.hasEnoughData

// Returns the status of the "Send" feature (ETH & MET) on the active chain
export const sendFeatureStatus = createSelector(
  getActiveWalletCoinBalance,
  getActiveWalletMetBalance,
  getIsOnline,
  (coinBalance, MetBalance, isOnline) =>
    !isOnline
      ? 'offline'
      : !utils.hasFunds(coinBalance) && !utils.hasFunds(MetBalance)
        ? 'no-funds'
        : 'ok'
)

// Returns the status of the "Send Metronome" feature on the active chain
export const sendMetFeatureStatus = createSelector(
  getActiveWalletMetBalance,
  getIsOnline,
  (MetBalance, isOnline) =>
    !isOnline ? 'offline' : !utils.hasFunds(MetBalance) ? 'no-funds' : 'ok'
)

// Returns the status of the "Buy Metronome" feature on the active chain
export const buyFeatureStatus = createSelector(
  getAuctionStatus,
  getIsOnline,
  (auctionStatus, isOnline) => {
    const isDepleted =
      auctionStatus &&
      auctionStatus.tokenRemaining &&
      !utils.hasFunds(auctionStatus.tokenRemaining)
    return !isOnline ? 'offline' : isDepleted ? 'depleted' : 'ok'
  }
)

// Returns the status of the "Converter" feature on the active chain
export const convertFeatureStatus = createSelector(
  getActiveWalletCoinBalance,
  getIsOnline,
  (coinBalance, isOnline) =>
    !isOnline ? 'offline' : !utils.hasFunds(coinBalance) ? 'no-eth' : 'ok'
)
