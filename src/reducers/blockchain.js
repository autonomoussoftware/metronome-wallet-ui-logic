import { handleActions } from 'redux-actions'

const initialState = {
  gasPrice: null,
  height: -1
}

const reducer = handleActions(
  {
    'initial-state-received': (state, { payload }) =>
      payload.blockchain
        ? {
            ...state,
            gasPrice:
              payload.blockchain.gasPrice || payload.config.DEFAULT_GAS_PRICE,
            height: payload.blockchain.height
          }
        : state,

    'eth-block': (state, { payload }) => ({
      ...state,
      height: payload.number
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
