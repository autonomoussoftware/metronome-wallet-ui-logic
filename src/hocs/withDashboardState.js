import { withClient } from './clientContext'
import * as selectors from '../selectors'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

const withDashboardState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      sendFeatureStatus: PropTypes.oneOf(['offline', 'no-funds', 'ok'])
        .isRequired,
      activeChain: PropTypes.string.isRequired,
      syncStatus: PropTypes.oneOf(['up-to-date', 'syncing', 'failed'])
        .isRequired,
      address: PropTypes.string.isRequired,
      client: PropTypes.shape({
        refreshAllTransactions: PropTypes.func.isRequired,
        copyToClipboard: PropTypes.func.isRequired
      }).isRequired
    }

    static displayName = `withDashboardState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    state = {
      refreshStatus: 'init',
      refreshError: null
    }

    onWalletRefresh = () => {
      this.setState({ refreshStatus: 'pending', refreshError: null })
      this.props.client
        .refreshAllTransactions({
          address: this.props.address,
          chain: this.props.activeChain
        })
        .then(() => this.setState({ refreshStatus: 'success' }))
        .catch(() =>
          this.setState({
            refreshStatus: 'failure',
            refreshError: 'Could not refresh'
          })
        )
    }

    render() {
      const { sendFeatureStatus } = this.props

      const sendDisabledReason =
        sendFeatureStatus === 'offline'
          ? "Can't send while offline"
          : sendFeatureStatus === 'no-funds'
            ? 'You need some funds to send'
            : null

      return (
        <WrappedComponent
          sendDisabledReason={sendDisabledReason}
          copyToClipboard={this.props.client.copyToClipboard}
          onWalletRefresh={this.onWalletRefresh}
          sendDisabled={sendFeatureStatus !== 'ok'}
          {...this.props}
          {...this.state}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    sendFeatureStatus: selectors.sendFeatureStatus(state),
    hasTransactions: selectors.hasTransactions(state),
    activeChain: selectors.getActiveChain(state),
    syncStatus: selectors.getTxSyncStatus(state),
    address: selectors.getActiveAddress(state)
  })

  return withClient(connect(mapStateToProps)(Container))
}

export default withDashboardState
