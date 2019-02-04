import { withClient } from './clientContext'
import * as selectors from '../selectors'
import { connect } from 'react-redux'

const mapStateToProps = (state, { client }) => ({
  coinSymbol: selectors.getCoinSymbol(state),
  fromWei: client.fromWei
})

export default Component => withClient(connect(mapStateToProps)(Component))
