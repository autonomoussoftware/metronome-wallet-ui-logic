import { handleActions } from 'redux-actions'
import get from 'lodash/get'

const initialState = {
  status: null
}

const reducer = handleActions(
  {
    'initial-state-received': (state, { payload }) => ({
      ...state,
      ...get(payload, 'auction', {})
    }),

    'auction-status-updated': (state, { payload }) => ({
      ...state,
      status: { ...state.status, ...payload }
    })
  },
  initialState
)

export default reducer
