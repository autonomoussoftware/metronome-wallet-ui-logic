import { connect } from 'react-redux'

import * as selectors from '../selectors'

const mapStateToProps = state => ({
  isOnline: selectors.getIsOnline(state),

  // default to null until initial state is received
  connections: state.chains.active
    ? selectors.getActiveChainConnectivity(state)
    : null,

  // default to null until initial state is received
  chainName: state.chains.active
    ? selectors.getActiveChainDisplayName(state)
    : null
})

export default connect(mapStateToProps)
