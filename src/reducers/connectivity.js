const initialState = {}

const ACTION_TYPE_SUFFIX = '-connection-status-changed'

/**
 * The active chain connectivity state
 *
 * @param {boolean} state - The current state
 * @param {Object} action - A standard Redux action
 * @returns {boolean} - The next state
 */
export default function(state = initialState, action) {
  // ignore connections persisted state
  if (action.type === 'initial-state-received') {
    return initialState
  }

  // update connection state on messages with a specific suffix
  const [connectionKey, ...other] = action.type.split(ACTION_TYPE_SUFFIX)
  if (other.length) {
    return {
      ...state,
      [connectionKey]: action.payload.connected
    }
  }

  return state
}
