import { handleActions } from 'redux-actions'

const initialState = {}

const reducer = handleActions(
  {
    'initial-state-received': (state, { payload }) =>
      payload.rates
        ? {
            ...state,
            ...payload.rates
          }
        : state,

    'eth-price-updated': (state, { payload }) => ({
      ...state,
      [payload.token]: payload
    }),

    'rates-set': (state, { payload }) => ({
      ...state,
      ...payload
    })
  },
  initialState
)

export default reducer
