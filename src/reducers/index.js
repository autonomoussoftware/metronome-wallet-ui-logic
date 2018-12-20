import { combineReducers } from 'redux'
import connectivity from './connectivity'
import session from './session'
import chains from './chains'
import config from './config'

export default combineReducers({
  connectivity,
  session,
  config,
  chains
})
