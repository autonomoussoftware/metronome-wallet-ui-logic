import * as selectors from '../selectors'
import { connect } from 'react-redux'
import * as utils from '../utils'
import PropTypes from 'prop-types'
import React from 'react'

const withTxRowState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      activeChainConfig: PropTypes.shape({
        converterAddress: PropTypes.string.isRequired,
        metTokenAddress: PropTypes.string.isRequired
      }).isRequired,
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
      const { tx, confirmations, activeChainConfig } = this.props

      return (
        <WrappedComponent
          converterAddress={activeChainConfig.converterAddress}
          metTokenAddress={activeChainConfig.metTokenAddress}
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
    activeChainConfig: selectors.getActiveChainConfig(state),
    confirmations: Math.min(6, selectors.getTxConfirmations(state, props)),
    coinSymbol: selectors.getCoinSymbol(state)
  })

  return connect(mapStateToProps)(Container)
}

export default withTxRowState
