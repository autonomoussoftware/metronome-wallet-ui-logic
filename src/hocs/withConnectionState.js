import { connect } from 'react-redux'

import * as selectors from '../selectors'

const mapStateToProps = state => ({
  // default to null until initial state is received
  isConnected: state.chains.active
    ? selectors.getChainConnectionStatus(state)
    : null,

  // default to null until initial state is received
  chainName: state.chains.active
    ? selectors.getActiveChainDisplayName(state)
    : null
})

export default connect(mapStateToProps)
