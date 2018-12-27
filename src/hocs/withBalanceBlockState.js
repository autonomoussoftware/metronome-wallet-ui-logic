import { withClient } from './clientContext'
import * as selectors from '../selectors'
import { connect } from 'react-redux'

const mapStateToProps = (state, { client }) => ({
  coinBalanceUSD: selectors.getCoinBalanceUSD(state, client),
  coinBalanceWei: selectors.getCoinBalanceWei(state),
  metBalanceWei: selectors.getMetBalanceWei(state),
  metBalanceUSD: selectors.getMetBalanceUSD(state),
  coinSymbol: selectors.getCoinSymbol(state)
})

export default Component => withClient(connect(mapStateToProps)(Component))
