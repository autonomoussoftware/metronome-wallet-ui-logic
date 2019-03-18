import * as selectors from '../selectors'
import { connect } from 'react-redux'
import * as utils from '../utils'
import PropTypes from 'prop-types'
import React from 'react'

const withTxRowState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      confirmations: PropTypes.number.isRequired,
      coinSymbol: PropTypes.string.isRequired,
      tx: PropTypes.shape({
        metBoughtInAuction: PropTypes.string,
        contractCallFailed: PropTypes.bool,
        txType: PropTypes.string.isRequired
      }).isRequired
    }

    static displayName = `withTxRowState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    render() {
      const { tx, confirmations } = this.props

      return (
        <WrappedComponent
          isPending={utils.isPending(tx, confirmations)}
          isFailed={utils.isFailed(tx, confirmations)}
          {...this.props}
          {...tx}
        />
      )
    }
  }

  const mapStateToProps = (state, props) => ({
    // avoid unnecessary re-renders once transaction is confirmed
    confirmations: Math.min(6, selectors.getTxConfirmations(state, props)),
    coinSymbol: selectors.getCoinSymbol(state)
  })

  return connect(mapStateToProps)(Container)
}

export default withTxRowState
