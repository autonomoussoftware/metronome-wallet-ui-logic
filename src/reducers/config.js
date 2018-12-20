import { handleActions } from 'redux-actions'

const initialState = {}

const reducer = handleActions(
  {
    'initial-state-received': (_, { payload }) => payload.config
  },
  initialState
)

export default reducer
