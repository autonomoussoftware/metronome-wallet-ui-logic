import { handleActions } from 'redux-actions'
import get from 'lodash/get'

const initialState = {
  lastUpdated: null,
  status: null
}

const reducer = handleActions(
  {
    'initial-state-received': (state, { payload }) => ({
      ...state,
      ...get(payload, 'converter', {})
    }),

    'converter-status-updated': (state, { payload }) => ({
      ...state,
      lastUpdated: parseInt(Date.now() / 1000, 10),
      status: payload
    })
  },
  initialState
)

export default reducer
