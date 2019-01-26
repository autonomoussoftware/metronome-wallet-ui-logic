import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

import { withClient } from './clientContext'
import * as selectors from '../selectors'

const withScanIndicatorState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      activeAddress: PropTypes.string.isRequired,
      activeChain: PropTypes.string.isRequired,
      syncStatus: PropTypes.oneOf(['up-to-date', 'syncing', 'failed'])
        .isRequired,
      syncBlock: PropTypes.number,
      isOnline: PropTypes.bool.isRequired,
      client: PropTypes.shape({
        refreshAllTransactions: PropTypes.func.isRequired
      }).isRequired
    }

    static displayName = `withScanIndicatorState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    onLabelClick = () => {
      if (this.props.isOnline && this.props.syncStatus !== 'syncing') {
        this.props.client.refreshAllTransactions({
          address: this.props.activeAddress,
          chain: this.props.activeChain
        })
      }
    }

    render() {
      const label = !this.props.isOnline
        ? 'Offline'
        : this.props.syncStatus === 'syncing'
          ? 'Syncing…'
          : this.props.syncStatus === 'failed'
            ? 'Sync failed'
            : 'Up-to-date'

      const tooltip = this.props.isOnline
        ? this.props.syncStatus === 'failed'
          ? 'Retry'
          : this.props.syncStatus === 'up-to-date'
            ? 'Refresh'
            : undefined
        : undefined

      return (
        <WrappedComponent
          onLabelClick={this.onLabelClick}
          tooltip={tooltip}
          label={label}
          {...this.props}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    activeAddress: selectors.getActiveAddress(state),
    activeChain: selectors.getActiveChain(state),
    isOnline: selectors.getIsOnline(state)
  })

  return withClient(connect(mapStateToProps)(Container))
}

export default withScanIndicatorState
