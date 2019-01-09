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
      coinSymbol: PropTypes.string.isRequired,
      client: PropTypes.shape({
        retryImport: PropTypes.func.isRequired
      }).isRequired
    }

    static displayName = `withPortState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    onRetry = hash => this.props.client.retryImport(hash)

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
