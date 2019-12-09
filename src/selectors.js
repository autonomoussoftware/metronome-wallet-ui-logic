import { createSelector } from 'reselect'
import mapValues from 'lodash/mapValues'
import flatMap from 'lodash/flatMap'
import uniqBy from 'lodash/uniqBy'
import sortBy from 'lodash/sortBy'
import get from 'lodash/get'

import * as utils from './utils'

// Returns the "chains" state branch
export const getChains = state => state.chains

// Returns the active chain id
export const getActiveChain = createSelector(
  getChains,
  chains => chains.active
)

// Returns a map of enabled chains by id
export const getChainsById = createSelector(
  getChains,
  chains => chains.byId
)

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

// Returns a map of type { [coinSymbol]: chainConfig }
// Useful for accessing fields like chain displayName when you only have the,
// chain coin symbol e.g. while parsing import/export metadata
export const getChainsConfigBySymbol = createSelector(
  getConfig,
  config =>
    Object.keys(config.chains).reduce((acc, chainId) => {
      const chainConfig = config.chains[chainId]
      acc[chainConfig.symbol] = { ...chainConfig, id: chainConfig }
      return acc
    }, {})
)

// Return if wallet is configured to be used with more than one chain.
// Useful for hiding UI elements that only make sense in multi-chain scenarios
export const getIsMultiChain = createSelector(
  getConfig,
  config => (config.enabledChains || []).length > 1
)

// Returns if the wallet is online or not (check reducer to see conditions)
export const getIsOnline = state => state.isOnline

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

// Returns the active address.
// It is ok to assume first address as active because only valid addresses are
// included in current wallet data
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

// Returns the current chain decimals amount
export const getCoinDecimals = createSelector(
  getActiveChainConfig,
  activeChainConfig => activeChainConfig.decimals
)

// Returns the current chain block time
export const getBlockTime = createSelector(
  getActiveChainConfig,
  activeChainConfig => activeChainConfig.blockTime
)

// Returns a valid address placeholder according to the active chain type
export const getAddressPlaceholder = createSelector(
  getActiveChainConfig,
  activeChainConfig =>
    ({
      ethereum: 'e.g. 0x2345678998765434567',
      qtum: 'e.g. qNycw1uZjV8fpnUBuuoo4'
    }[activeChainConfig.chainType] || '')
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
  getActiveChainConfig,
  getCoinRate,
  getClient,
  (balance, activeChainConfig, coinRate, client) => {
    if (!balance || !coinRate) return '0'
    const usdValue =
      parseFloat(client.toCoin(activeChainConfig, balance)) * coinRate
    return usdValue.toFixed(2)
  }
)

// Returns an object of connection statuses { [connection label]: boolean }
export const getActiveChainConnectivity = createSelector(
  getActiveChainConfig,
  getActiveChainData,
  ({ connections }, { connectivity }) =>
    Object.keys(connections || {}).reduce((acc, connectionKey) => {
      acc[connections[connectionKey]] =
        typeof connectivity[connectionKey] === 'undefined'
          ? true
          : connectivity[connectionKey]
      return acc
    }, {})
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
  (chainConfig, chainMeta) =>
    // Parity may return 0 as gasPrice if latests blocks are empty
    !chainMeta.gasPrice || parseInt(chainMeta.gasPrice, 10) <= 0
      ? chainConfig.defaultGasPrice
      : chainMeta.gasPrice
)

// Returns the explorer URL for a specific transaction
export const getExplorerUrl = createSelector(
  getActiveChainConfig,
  (_, props) => props.hash,
  (config, hash) =>
    config.explorerUrl ? config.explorerUrl.replace('{{hash}}', hash) : '#'
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

// Returns wallet transactions sync status on the active chain
export const getTxSyncStatus = createSelector(
  getActiveChainData,
  chainData => get(chainData, 'wallets.syncStatus', null)
)

// Returns if renderer has enough data to load the wallet UI.
// Renderer will display the "Gathering data..." screen until it does.
export const hasEnoughData = state => state.session.hasEnoughData

// Returns the message of the last wallet-error message received
// Useful for watching changes and fire notifications
export const getLastError = state => state.session.lastError

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
  getActiveWalletCoinBalance,
  getAuctionStatus,
  getIsOnline,
  (coinBalance, auctionStatus, isOnline) => {
    const isDepleted =
      auctionStatus &&
      auctionStatus.tokenRemaining &&
      !utils.hasFunds(auctionStatus.tokenRemaining)
    return isOnline
      ? isDepleted
        ? 'depleted'
        : utils.hasFunds(coinBalance)
        ? 'ok'
        : 'no-coin'
      : 'offline'
  }
)

// Returns the status of the "Converter" feature on the active chain
export const convertFeatureStatus = createSelector(
  getActiveWalletCoinBalance,
  getIsOnline,
  (coinBalance, isOnline) =>
    isOnline ? (utils.hasFunds(coinBalance) ? 'ok' : 'no-coin') : 'offline'
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

export const getMergedTransactions = createSelector(
  getChainsById,
  getConfig,
  (chainsById, config) =>
    flatMap(chainsById, ({ wallets }, chainName) =>
      flatMap(wallets.byId, ({ addresses }) =>
        flatMap(addresses, ({ transactions }) =>
          (transactions || []).map(t => ({
            ...t,
            originChain: config.chains[chainName].symbol
          }))
        )
      )
    )
)

// Returns a transaction object given a transaction hash
export const getTransactionFromHash = createSelector(
  getMergedTransactions,
  getActiveAddress,
  (state, props) => props.hash,
  (transactions, activeAddress, hash) =>
    transactions
      .map(utils.createTransactionParser(activeAddress))
      .find(tx => tx.hash === hash)
)

// Returns an array of ongoing imports with not enough validations yet
export const getOngoingImports = createSelector(
  getActiveWalletTransactions,
  getMergedTransactions,
  (transactions, allTx) => {
    // get all import requests
    const importRequests = transactions.filter(
      ({ txType }) => txType === 'import-requested'
    )
    return (
      // omit retries
      uniqBy(importRequests, ({ portBurnHash }) => portBurnHash)
        // omit already imported
        .filter(
          ({ portBurnHash }) =>
            transactions.findIndex(
              tx => tx.txType === 'imported' && portBurnHash === tx.portBurnHash
            ) === -1
        )
        // add the count for all their validations and refutations
        .map(tx => {
          const attestations = transactions.filter(
            ({ txType, portBurnHash }) =>
              (txType === 'attestation' || txType === 'imported') &&
              portBurnHash === tx.portBurnHash
          )
          const exportTx = allTx.find(
            globalTx =>
              get(globalTx, 'meta.metronome.export.currentBurnHash', false) ===
              tx.portBurnHash
          )
          return {
            attestedCount: attestations.filter(
              ({ isAttestationValid }) => isAttestationValid
            ).length,
            refutedCount: attestations.filter(
              ({ isAttestationValid }) => !isAttestationValid
            ).length,
            ...tx,
            ...get(exportTx, 'meta.metronome.export', {}),
            originChain: get(exportTx, 'originChain')
          }
        })
    )
  }
)

// Returns an array of exports that lack an import operation
export const getFailedImports = createSelector(
  getMergedTransactions,
  getActiveAddressData,
  getActiveAddress,
  getCoinSymbol,
  (allTx, activeAddressData, activeAddress, coinSymbol) => {
    /**
     * @param {Object} tx - Unparsed transaction object
     * @returns {boolean} True if export transaction with active chain as destination
     */
    function isFailedImport(tx) {
      const isExport = get(tx, 'meta.metronome.export', false)

      const isForActiveChain =
        get(tx, 'meta.metronome.export.destinationChain', null) === coinSymbol

      const isForActiveAddress =
        get(tx, 'meta.metronome.export.to', null) === activeAddress

      const burnHash = get(tx, 'meta.metronome.export.currentBurnHash', null)

      const wasImportRequested = !!(activeAddressData.transactions || []).find(
        transaction =>
          get(
            transaction,
            'meta.metronome.importRequest.currentBurnHash',
            null
          ) === burnHash
      )

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
        coinBalance: get(
          walletsData,
          ['byId', activeWallet, 'addresses', activeAddress, 'balance'],
          null
        ),
        coinSymbol: chainConfig.symbol,
        address: activeAddress,
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

// Returns the status of the "Port" feature on the active chain
export const portFeatureStatus = createSelector(
  getActiveWalletCoinBalance,
  getActiveWalletMetBalance,
  getChainsWithBalances,
  getActiveChain,
  getChainMeta,
  getIsOnline,
  getConfig,
  // eslint-disable-next-line max-params
  (coinBalance, metBalance, balances, activeChain, chainMeta, isOnline, cfg) =>
    cfg.enabledChains.length > 1
      ? isOnline
        ? typeof chainMeta.chainHopStartTime === 'number'
          ? chainMeta.isChainHopEnabled
            ? utils.hasFunds(coinBalance)
              ? utils.hasFunds(metBalance)
                ? balances.filter(
                    chain =>
                      chain.id !== activeChain &&
                      utils.hasFunds(chain.coinBalance)
                  ).length > 0
                  ? 'ok'
                  : 'no-destination-coin'
                : 'no-met'
              : 'no-coin'
            : 'not-enabled'
          : 'waiting-meta'
        : 'offline'
      : 'no-multichain'
)

export const getChainHopStartTime = createSelector(
  getChainMeta,
  chainMeta => chainMeta.chainHopStartTime
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

// Return an array of { label, value, disabledReason } with available port destinations
export const getPortDestinations = createSelector(
  getChainsWithBalances,
  getActiveChain,
  getChainsById,
  (balances, active, chainsById) =>
    balances
      .filter(chain => chain.id !== active)
      .map(chain => ({
        disabledReason: utils.hasFunds(chain.coinBalance)
          ? chainsById[chain.id].meta.isChainHopEnabled
            ? null
            : 'Port not enabled yet'
          : `No ${chain.coinSymbol} to pay for import gas`,
        address: chain.address,
        label: chain.displayName,
        value: chain.id
      }))
)
