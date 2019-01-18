import { combineReducers } from 'redux'
import get from 'lodash/get'

import converter from './converter'
import wallets from './wallets'
import auction from './auction'
import meta from './meta'

const initialState = {
  active: null,
  byId: {}
}

const createChainReducer = chain => (state, action) => {
  // ignore messages specifically intended for other chains
  if (get(action, 'payload.chain') && action.payload.chain !== chain) {
    return state
  }
  return combineReducers({
    converter,
    auction,
    wallets,
    meta
  })(state, action)
}

export default function(state = initialState, action) {
  switch (action.type) {
    // init state from persisted state and config
    case 'initial-state-received': {
      if (get(action, 'payload.config.enabledChains', []).length < 1) {
        throw new Error(
          'config must contain an "enabledChain" property with at least one value.'
        )
      }

      const persistedActiveChain = get(action, 'payload.chains.active')
      const enabledChains = action.payload.config.enabledChains

      return {
        active: enabledChains.includes(persistedActiveChain)
          ? persistedActiveChain
          : enabledChains[0],
        byId: enabledChains.reduce((byId, chainName) => {
          byId[chainName] = createChainReducer(chainName)(
            state.byId[chainName],
            {
              ...action,
              payload: {
                ...get(action, ['payload', 'chains', 'byId', chainName], {}),
                config: action.payload.config.chains[chainName]
              }
            }
          )
          return byId
        }, {})
      }
    }

    case 'active-chain-changed':
      return { ...state, active: action.payload }

    // for any other message, redirect action to every chain reducer
    default: {
      const enabledChains = Object.keys(state.byId)
      return {
        ...state,
        byId: enabledChains.reduce((byId, chainName) => {
          byId[chainName] = createChainReducer(chainName)(
            state.byId[chainName],
            action
          )
          return byId
        }, {})
      }
    }
  }
}
