import { handleActions } from 'redux-actions'
import mergeWith from 'lodash/mergeWith'
import unionBy from 'lodash/unionBy'
import get from 'lodash/get'

const initialState = {
  isScanningTx: false,
  active: null,
  allIds: null,
  byId: null
}

const reducer = handleActions(
  {
    'initial-state-received': (state, { payload }) => ({
      ...state,
      ...get(payload, 'wallets', {}),
      isScanningTx: state.isScanningTx
    }),

    'create-wallet': (state, { payload }) => ({
      ...state,
      allIds: [...(state.allIds || []), payload.walletId],
      active: payload.walletId
    }),

    'open-wallets': (state, { payload }) => ({
      ...state,
      allIds: payload.walletIds,
      active: payload.activeWallet || payload.walletIds[0] || null
    }),

    'wallet-state-changed': (state, { payload }) => ({
      ...state,
      byId: mergeWith(
        {},
        state.byId || {},
        payload,
        (objValue, srcValue, key) => {
          if (key === 'transactions') {
            return unionBy(srcValue, objValue, 'transaction.hash')
          }
        }
      )
    }),

    'wallets-set': (state, { payload }) => ({
      ...state,
      ...payload
    }),

    'transactions-scan-started': state => ({
      ...state,
      isScanningTx: true
    }),

    'transactions-scan-finished': state => ({
      ...state,
      isScanningTx: false
    })
  },
  initialState
)

export default reducer
