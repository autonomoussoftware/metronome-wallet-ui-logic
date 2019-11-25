import { connect } from 'react-redux'

import { withClient } from './clientContext'
import * as selectors from '../selectors'

const mapStateToProps = (state, { client }) => ({
  connections: selectors.getActiveChainConnectivity(state),
  appVersion: client.getAppVersion(),
  chainName: selectors.getActiveChainDisplayName(state),
  isOnline: selectors.getIsOnline(state),
  ...selectors.getChainMeta(state)
})

export default Component => withClient(connect(mapStateToProps)(Component))
