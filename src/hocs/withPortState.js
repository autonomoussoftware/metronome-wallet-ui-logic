import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

import * as selectors from '../selectors'

const withPortState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      retryImportFeatureStatus: PropTypes.oneOf([
        'no-multichain',
        'offline',
        'no-coin',
        'ok'
      ]).isRequired,
      portFeatureStatus: PropTypes.oneOf([
        'no-multichain',
        'offline',
        'no-coin',
        'no-met',
        'ok'
      ]).isRequired,
      attestationThreshold: PropTypes.number.isRequired,
      failedImports: PropTypes.array.isRequired,
      coinSymbol: PropTypes.string.isRequired
    }

    static displayName = `withPortState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    render() {
      const {
        retryImportFeatureStatus,
        portFeatureStatus,
        coinSymbol
      } = this.props

      const portDisabledReason =
        portFeatureStatus === 'no-multichain'
          ? 'This wallet has only one enabled chain'
          : portFeatureStatus === 'offline'
            ? "Can't port while offline"
            : portFeatureStatus === 'no-coin'
              ? `You need some ${coinSymbol} to pay for port gas`
              : portFeatureStatus === 'no-met'
                ? 'You need some MET to port'
                : null

      const retryDisabledReason =
        retryImportFeatureStatus === 'no-multichain'
          ? 'This wallet has only one enabled chain'
          : retryImportFeatureStatus === 'offline'
            ? "Can't retry while offline"
            : retryImportFeatureStatus === 'no-coin'
              ? `You need some ${coinSymbol} to pay for import gas`
              : null

      return (
        <WrappedComponent
          retryDisabledReason={retryDisabledReason}
          portDisabledReason={portDisabledReason}
          shouldRenderForm={portFeatureStatus !== 'no-multichain'}
          retryDisabled={retryImportFeatureStatus !== 'ok'}
          portDisabled={portFeatureStatus !== 'ok'}
          {...this.props}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    retryImportFeatureStatus: selectors.retryImportFeatureStatus(state),
    attestationThreshold: selectors.getAttestationThreshold(state),
    portFeatureStatus: selectors.portFeatureStatus(state),
    ongoingImports: selectors.getOngoingImports(state),
    failedImports: selectors.getFailedImports(state),
    coinSymbol: selectors.getCoinSymbol(state)
  })

  return connect(mapStateToProps)(Container)
}

export default withPortState
