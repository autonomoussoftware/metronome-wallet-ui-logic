import { handleActions } from 'redux-actions'

const initialState = {
  hasEnoughData: false,
  isLoggedIn: false,
  lastError: null
}

const reducer = handleActions(
  {
    'session-started': state => ({
      ...state,
      isLoggedIn: true
    }),
    'required-data-gathered': state => ({
      ...state,
      hasEnoughData: true
    }),
    'wallet-error': (state, { payload }) => ({
      ...state,
      lastError: payload.message
    })
  },
  initialState
)

export default reducer
