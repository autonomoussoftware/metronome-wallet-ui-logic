import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

import { withClient } from './clientContext'
import * as selectors from '../selectors'

const withPortState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      portFeatureStatus: PropTypes.oneOf(['offline', 'no-coin', 'ok'])
        .isRequired,
      failedImports: PropTypes.array.isRequired,
      coinSymbol: PropTypes.string.isRequired,
      client: PropTypes.shape({
        retryImport: PropTypes.func.isRequired
      }).isRequired
    }

    static displayName = `withPortState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    onRetry = hash => {
      const tx = this.props.failedImports.find(
        ({ currentBurnHash }) => currentBurnHash === hash
      )

      const payload = {
        destinationChain: tx.meta.destinationChain,
        previousBurnHash: tx.meta.previousBurnHash,
        currentBurnHash: tx.meta.currentBurnHash,
        blockTimestamp: tx.meta.blockTimestamp,
        dailyMintable: tx.meta.dailyMintable,
        burnSequence: tx.meta.burnSequence,
        currentTick: tx.meta.currentTick,
        originChain: tx.originChain,
        value: tx.meta.value,
        from: tx.receipt.from,
        fee: tx.meta.fee
      }

      this.props.client.retryImport(payload)
    }

    render() {
      const { portFeatureStatus, coinSymbol } = this.props

      const portDisabledReason =
        portFeatureStatus === 'offline'
          ? "Can't port while offline"
          : portFeatureStatus === 'no-coin'
            ? `You need some ${coinSymbol} to pay for port gas`
            : null

      return (
        <WrappedComponent
          portDisabledReason={portDisabledReason}
          portDisabled={portFeatureStatus !== 'ok'}
          onRetry={this.onRetry}
          {...this.props}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    portFeatureStatus: selectors.portFeatureStatus(state),
    pendingImports: selectors.getPendingImports(state),
    failedImports: selectors.getFailedImports(state),
    coinSymbol: selectors.getCoinSymbol(state)
  })

  return withClient(connect(mapStateToProps)(Container))
}

export default withPortState
