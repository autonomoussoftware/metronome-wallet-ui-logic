import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

import * as selectors from '../selectors'

const withSendDrawerState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      sendMetFeatureStatus: PropTypes.oneOf(['no-funds', 'offline', 'ok'])
        .isRequired,
      coinSymbol: PropTypes.string.isRequired
    }

    static displayName = `withSendDrawerState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    render() {
      const { sendMetFeatureStatus } = this.props

      const sendMetDisabledReason =
        sendMetFeatureStatus === 'no-funds'
          ? 'You need some MET to send'
          : sendMetFeatureStatus === 'offline'
            ? "Can't send while offline"
            : null

      return (
        <WrappedComponent
          sendMetDisabledReason={sendMetDisabledReason}
          sendMetDisabled={sendMetFeatureStatus !== 'ok'}
          {...this.props}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    sendMetFeatureStatus: selectors.sendMetFeatureStatus(state),
    coinSymbol: selectors.getCoinSymbol(state)
  })

  return connect(mapStateToProps)(Container)
}

export default withSendDrawerState
