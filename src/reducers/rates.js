import { handleActions, combineActions } from 'redux-actions'

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

    [combineActions(
      'coin-price-updated',
      'eth-price-updated' // TODO: remove!
    )]: (state, { payload }) => ({
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
