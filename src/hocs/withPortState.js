import * as selectors from '../selectors'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

const withPortState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      portFeatureStatus: PropTypes.oneOf(['offline', 'no-coin', 'ok'])
        .isRequired
    }

    static displayName = `withPortState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    render() {
      const { portFeatureStatus } = this.props

      const portDisabledReason =
        portFeatureStatus === 'offline'
          ? "Can't port while offline"
          : portFeatureStatus === 'no-coin'
            ? 'You need some ETH to pay for port gas'
            : null

      return (
        <WrappedComponent
          portDisabledReason={portDisabledReason}
          portDisabled={portFeatureStatus !== 'ok'}
          {...this.props}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    portFeatureStatus: selectors.portFeatureStatus(state)
  })

  return connect(mapStateToProps)(Container)
}

export default withPortState
