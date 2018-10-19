import { handleActions } from 'redux-actions'

const initialState = {
  gasPrice: null,
  height: -1
}

const reducer = handleActions(
  {
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
