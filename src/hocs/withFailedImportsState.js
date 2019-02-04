import * as selectors from '../selectors'
import { connect } from 'react-redux'

const mapStateToProps = state => ({
  amount: selectors.getFailedImports(state).length
})

export default connect(mapStateToProps)
