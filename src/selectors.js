import { createSelector } from 'reselect'
import mapValues from 'lodash/mapValues'
import flatMap from 'lodash/flatMap'
import sortBy from 'lodash/sortBy'
import get from 'lodash/get'

import * as utils from './utils'

// Returns the "chains" state branch
export const getChains = state => state.chains

// Returns the active chain id
export const getActiveChain = createSelector(getChains, chains => chains.active)

// Returns a map of enabled chains by id
export const getChainsById = createSelector(getChains, chains => chains.byId)

// Returns all the data related to the active chain
export const getActiveChainData = createSelector(
  getActiveChain,
  getChainsById,
  (active, chainsById) => chainsById[active]
)

// Returns the client (useful for accessing helpers inside other selectors)
export const getClient = (props, client) => client

// Returns the "config" state branch
export const getConfig = state => state.config

// Returns the chain-specific config of the active chain
export const getActiveChainConfig = createSelector(
  getActiveChain,
  getConfig,
  (activeChain, config) => config.chains[activeChain]
)

// Returns the active chain display name
export const getActiveChainDisplayName = createSelector(
  getActiveChainConfig,
  ({ displayName }) => displayName
)

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

// Returns all user wallets on active chain
const getWalletsById = createSelector(
  getActiveChainData,
  chainData => chainData.wallets.byId
)

// Returns the active wallet id on active chain
export const getActiveWalletId = createSelector(
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
  getActiveChainConfig,
  (activeAddressData, activeChainConfig) =>
    get(
      activeAddressData,
      ['token', activeChainConfig.metTokenAddress, 'balance'],
      null
    )
)

// Returns the current coin rate
export const getCoinRate = createSelector(
  getActiveChainData,
  chainData => chainData.meta.rate
)

// Returns the current chain symbol (e.g. to display next to amounts)
export const getCoinSymbol = createSelector(
  getActiveChainConfig,
  activeChainConfig => activeChainConfig.symbol
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

// Returns the timestamp of most recent auction status received
export const getAuctionLastUpdated = createSelector(
  getAuction,
  auction => auction.lastUpdated
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

// Returns the timestamp of most recent converter status received
export const getConverterLastUpdated = createSelector(
  getConverter,
  converter => converter.lastUpdated
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

// Returns the active chain attestation threshold
export const getAttestationThreshold = createSelector(
  getChainMeta,
  chainMeta => chainMeta.attestationThreshold
)

// Returns the active chain current gas price
export const getChainGasPrice = createSelector(
  getActiveChainConfig,
  getChainMeta,
  (chainConfig, chainMeta) => chainMeta.gasPrice || chainConfig.defaultGasPrice
)

// Returns the active chain connection status
export const getChainConnectionStatus = createSelector(
  getActiveChain,
  getChainMeta,
  (activeChain, chainMeta) => (activeChain ? chainMeta.isWeb3Connected : null)
)

// Returns the explorer URL for a specific transaction
export const getExplorerUrl = createSelector(
  getActiveChainConfig,
  (_, props) => props.hash,
  (config, hash) =>
    config.explorerUrl ? config.explorerUrl.replace('{{hash}}', hash) : '#'
)

// Returns the indexer connection status
export const getIndexerConnectionStatus = createSelector(
  getActiveChain,
  getChainMeta,
  (activeChain, chainMeta) =>
    activeChain ? chainMeta.isIndexerConnected : null
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
      .filter(({ txType }) => txType !== 'attestation')
  }
)

// Returns if the current wallet/address has transactions on the active chain
export const hasTransactions = createSelector(
  getActiveWalletTransactions,
  transactions => transactions.length > 0
)

// Returns wallet transactions sync status on the active chain
export const getTxSyncStatus = createSelector(
  getActiveChainData,
  chainData => chainData.wallets.syncStatus
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
  (coinBalance, metBalance, isOnline) =>
    isOnline
      ? !utils.hasFunds(coinBalance) && !utils.hasFunds(metBalance)
        ? 'no-funds'
        : 'ok'
      : 'offline'
)

// Returns the status of the "Send Metronome" feature on the active chain
export const sendMetFeatureStatus = createSelector(
  getActiveWalletMetBalance,
  getIsOnline,
  (metBalance, isOnline) =>
    isOnline ? (utils.hasFunds(metBalance) ? 'ok' : 'no-funds') : 'offline'
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
    return isOnline ? (isDepleted ? 'depleted' : 'ok') : 'offline'
  }
)

// Returns the status of the "Converter" feature on the active chain
export const convertFeatureStatus = createSelector(
  getActiveWalletCoinBalance,
  getIsOnline,
  (coinBalance, isOnline) =>
    isOnline ? (utils.hasFunds(coinBalance) ? 'ok' : 'no-coin') : 'offline'
)

// Returns the status of the "Port" feature on the active chain
export const portFeatureStatus = createSelector(
  getActiveWalletCoinBalance,
  getActiveWalletMetBalance,
  getIsOnline,
  getConfig,
  (coinBalance, metBalance, isOnline, config) =>
    config.enabledChains.length > 0
      ? isOnline
        ? utils.hasFunds(coinBalance)
          ? utils.hasFunds(metBalance)
            ? 'ok'
            : 'no-met'
          : 'no-coin'
        : 'offline'
      : 'no-multichain'
)

// Returns the status of the "Retry Import" feature on the active chain
export const retryImportFeatureStatus = createSelector(
  getActiveWalletCoinBalance,
  getIsOnline,
  getConfig,
  (coinBalance, isOnline, config) =>
    config.enabledChains.length > 0
      ? isOnline
        ? utils.hasFunds(coinBalance)
          ? 'ok'
          : 'no-coin'
        : 'offline'
      : 'no-multichain'
)

// Returns an array of ongoing imports with not enough validations yet
export const getPendingImports = createSelector(getActiveChain, () => [])

// Returns an array of exports that lack an import operation
export const getFailedImports = createSelector(
  getActiveAddressData,
  getActiveAddress,
  getChainsById,
  getCoinSymbol,
  getConfig,
  // eslint-disable-next-line max-params
  (activeAddressData, activeAddress, chainsById, coinSymbol, config) => {
    // combine all txs, from all addresses, from all wallets, from all chains
    const allTx = flatMap(chainsById, ({ wallets }, chainName) =>
      flatMap(wallets.byId, ({ addresses }) =>
        flatMap(addresses, ({ transactions }) =>
          (transactions || []).map(t => ({
            ...t,
            originChain: config.chains[chainName].symbol
          }))
        )
      )
    )

    // keep only export transactions with active chain as destination
    function isFailedImport(tx) {
      const isExport = get(tx, 'meta.metronome.export', false)

      const isForActiveChain =
        get(tx, 'meta.metronome.export.destinationChain', null) === coinSymbol

      const isForActiveAddress =
        get(tx, 'meta.metronome.export.to', null) === activeAddress

      const burnHash = get(tx, 'meta.metronome.export.currentBurnHash', null)

      const wasImportRequested =
        (activeAddressData.transactions || []).findIndex(
          transaction =>
            get(
              transaction,
              'meta.metronome.importRequest.currentBurnHash',
              null
            ) === burnHash
        ) > -1

      return (
        isExport &&
        isForActiveChain &&
        isForActiveAddress &&
        !wasImportRequested
      )
    }

    return allTx.filter(isFailedImport).map(t => ({
      originChain: t.originChain,
      from: get(t, 'receipt.from', ''),
      ...get(t, 'meta.metronome.export', {})
    }))
  }
)

export const getChainsWithBalances = createSelector(
  getChainsById,
  getConfig,
  (chainsById, config) =>
    Object.keys(chainsById).map(chainName => {
      const chainConfig = config.chains[chainName]
      const walletsData = chainsById[chainName].wallets
      const activeWallet = walletsData.active
      const activeAddress = Object.keys(
        walletsData.byId[activeWallet].addresses
      )[0]
      return {
        displayName: chainConfig.displayName,
        balance: get(
          walletsData,
          [
            'byId',
            activeWallet,
            'addresses',
            activeAddress,
            'token',
            chainConfig.metTokenAddress,
            'balance'
          ],
          null
        ),
        id: chainName
      }
    })
)

export const getChainsReadyStatus = createSelector(
  getChainsById,
  getConfig,
  (chainsById, config) =>
    mapValues(chainsById, (chainData, chainName) => {
      const chainConfig = config.chains[chainName]
      const walletsData = chainData.wallets
      const activeWallet = walletsData.active
      const activeAddress =
        Object.keys(
          get(walletsData, ['byId', activeWallet, 'addresses'], {})
        )[0] || null
      const chainMeta = chainData.meta
      return {
        hasCoinBalance:
          get(
            walletsData,
            ['byId', activeWallet, 'addresses', activeAddress, 'balance'],
            null
          ) !== null,
        hasMetBalance:
          get(
            walletsData,
            [
              'byId',
              activeWallet,
              'addresses',
              activeAddress,
              'token',
              chainConfig.metTokenAddress,
              'balance'
            ],
            null
          ) !== null,
        hasBlockHeight: chainMeta.height > -1,
        hasCoinRate: chainMeta.rate !== null,
        displayName: chainConfig.displayName,
        symbol: chainConfig.symbol
      }
    })
)

// Return an array of { label, value } with available port destinations
export const getPortDestinations = createSelector(
  getActiveChain,
  getConfig,
  (active, config) =>
    config.enabledChains.filter(chainId => chainId !== active).map(chainId => ({
      label: config.chains[chainId].displayName,
      value: chainId
    }))
)
