import { handleActions } from 'redux-actions'
import get from 'lodash/get'

const initialState = {
  isConnected: null,
  gasPrice: null,
  height: -1,
  rate: null
}

const reducer = handleActions(
  {
    'web3-connection-status-changed': (state, { payload }) => ({
      ...state,
      isConnected: payload.connected
    }),

    'initial-state-received': (state, { payload }) => ({
      ...state,
      ...get(payload, 'meta', {}),
      isConnected: null, // ignore web3 connection status persisted state
      gasPrice: get(payload, 'meta.gasPrice', payload.config.defaultGasPrice)
    }),

    'coin-block': (state, { payload }) => ({
      ...state,
      height: payload.number
    }),

    'coin-price-updated': (state, { payload }) => ({
      ...state,
      rate: payload.price
    }),

    'gas-price-updated': (state, { payload }) => ({
      ...state,
      gasPrice: payload
    }),

    'blockchain-set': (state, { payload }) => ({
      ...state,
      ...payload
    })
  },
  initialState
)

export default reducer
