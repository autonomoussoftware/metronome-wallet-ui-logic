import { combineReducers } from 'redux'
import isOnline from './isOnline'
import session from './session'
import chains from './chains'
import config from './config'

export default combineReducers({
  isOnline,
  session,
  config,
  chains
})
