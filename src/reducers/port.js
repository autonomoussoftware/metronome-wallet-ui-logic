import { handleActions } from 'redux-actions'
import get from 'lodash/get'

const initialState = {
  pendingImports: [],
  failedImports: []
}

const reducer = handleActions(
  {
    'initial-state-received': (state, { payload }) => ({
      ...state,
      ...get(payload, 'port', {})
    })
  },
  initialState
)

export default reducer
