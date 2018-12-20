import { handleActions, combineActions } from 'redux-actions'

const initialState = {
  isOnline: true
}

// Set connectivity status to 'online' if any of these actions is received
const CONNECTIVITY_PROOF_ACTIONS = [
  'mtn-converter-status-updated',
  'auction-status-updated',
  'auction-status-updated',
  'wallet-state-changed',
  'coin-price-updated',
  'eth-price-updated', // TODO: remove!
  'coin-block',
  'eth-block' // TODO: remove!
]

const reducer = handleActions(
  {
    'connectivity-state-changed': (state, action) => ({
      ...state,
      isOnline: Boolean(action.payload.ok)
    }),
    [combineActions(...CONNECTIVITY_PROOF_ACTIONS)]: state => ({
      ...state,
      isOnline: true
    })
  },
  initialState
)

export default reducer
