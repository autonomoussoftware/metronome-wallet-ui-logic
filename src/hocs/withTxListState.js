import * as selectors from '../selectors'
import { connect } from 'react-redux'

const mapStateToProps = state => ({
  isMultiChain: selectors.getIsMultiChain(state),
  items: selectors.getActiveWalletTransactions(state)
})

export default Component => connect(mapStateToProps)(Component)
