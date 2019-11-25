const initialState = true

/**
 * The wallet connectivity state
 *
 * @param {boolean} state - The current state
 * @param {Object} action - A standard Redux action
 * @returns {boolean} - The next state
 */
export default function(state = initialState, action) {
  switch (action.type) {
    case 'connectivity-state-changed':
      return Boolean(action.payload.ok)

    // Set connectivity status to 'online' if any of these actions is received
    case 'converter-status-updated':
    case 'auction-status-updated':
    case 'wallet-state-changed':
    case 'coin-price-updated':
    case 'coin-block':
      return true

    default:
      return state
  }
}
