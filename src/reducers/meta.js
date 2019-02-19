import { handleActions } from 'redux-actions'
import get from 'lodash/get'

const initialState = {
  attestationThreshold: null,
  bestBlockTimestamp: null,
  isIndexerConnected: null,
  isWeb3Connected: null,
  rateLastUpdated: null,
  gasPrice: null,
  height: -1,
  rate: null
}

const reducer = handleActions(
  {
    'indexer-connection-status-changed': (state, { payload }) => ({
      ...state,
      isIndexerConnected: payload.connected
    }),

    'web3-connection-status-changed': (state, { payload }) => ({
      ...state,
      isWeb3Connected: payload.connected
    }),

    'initial-state-received': (state, { payload }) => ({
      ...state,
      ...get(payload, 'meta', {}),
      isConnected: null, // ignore web3 connection status persisted state
      gasPrice: get(payload, 'meta.gasPrice', payload.config.defaultGasPrice)
    }),

    'coin-block': (state, { payload }) => ({
      ...state,
      bestBlockTimestamp: payload.timestamp,
      height: payload.number
    }),

    'coin-price-updated': (state, { payload }) => ({
      ...state,
      rateLastUpdated: parseInt(Date.now() / 1000, 10),
      rate: payload.price
    }),

    'gas-price-updated': (state, { payload }) => ({
      ...state,
      gasPrice: payload
    }),

    'attestation-threshold-updated': (state, { payload }) => ({
      ...state,
      attestationThreshold: payload.threshold
    }),

    'blockchain-set': (state, { payload }) => ({
      ...state,
      ...payload
    })
  },
  initialState
)

export default reducer
