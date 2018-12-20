import { handleActions, combineActions } from 'redux-actions'

const initialState = {
  gasPrice: null,
  height: -1,
  rate: null
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
        : {
            ...state,
            gasPrice: payload.config.DEFAULT_GAS_PRICE
          },

    // TODO: remove eth action
    [combineActions('coin-block', 'eth-block')]: (state, { payload }) => ({
      ...state,
      height: payload.number
    }),

    // TODO: remove eth action
    [combineActions('coin-price-updated', 'eth-price-updated')]: (
      state,
      { payload }
    ) => ({
      ...state,
      rate: payload
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
