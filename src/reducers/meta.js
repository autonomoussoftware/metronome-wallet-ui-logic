import { handleActions } from 'redux-actions'
import get from 'lodash/get'

const initialState = {
  attestationThreshold: null,
  bestBlockTimestamp: null,
  chainHopStartTime: null,
  isChainHopEnabled: null,
  rateLastUpdated: null,
  gasPrice: null,
  height: -1,
  rate: null
}

const reducer = handleActions(
  {
    'initial-state-received': (state, { payload }) => ({
      ...state,
      ...get(payload, 'meta', {}),
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

    'chain-hop-start-time-updated': (state, { payload }) => ({
      ...state,
      chainHopStartTime: payload.chainHopStartTime,
      // Check if we are past start time on each new block
      isChainHopEnabled: Date.now() > payload.chainHopStartTime
    }),

    'blockchain-set': (state, { payload }) => ({
      ...state,
      ...payload
    })
  },
  initialState
)

export default reducer
