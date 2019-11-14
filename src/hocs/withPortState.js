import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import moment from 'moment'
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
        'no-destination-coin',
        'no-multichain',
        'waiting-meta',
        'not-enabled',
        'offline',
        'no-coin',
        'no-met',
        'ok'
      ]).isRequired,
      attestationThreshold: PropTypes.number,
      chainHopStartTime: PropTypes.number,
      failedImports: PropTypes.array.isRequired,
      coinSymbol: PropTypes.string.isRequired
    }

    static displayName = `withPortState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    render() {
      const {
        retryImportFeatureStatus,
        portFeatureStatus,
        chainHopStartTime,
        coinSymbol
      } = this.props

      const portDisabledReason = {
        'no-destination-coin': `You need some funds in the destination chains to pay for port gas`,
        'no-multichain': 'This wallet has only one enabled chain',
        'waiting-meta': 'Waiting for current chain port feature status',
        'not-enabled': `Port operations will be enabled on ${moment(
          chainHopStartTime
        ).format('LLL')}`,
        'no-coin': `You need some ${coinSymbol} to pay for port gas`,
        'no-met': 'You need some MET to port',
        offline: "Can't port while offline"
      }[portFeatureStatus]

      const retryDisabledReason = {
        'no-multichain': 'This wallet has only one enabled chain',
        'no-coin': `You need some ${coinSymbol} to pay for import gas`,
        offline: "Can't retry while offline"
      }[retryImportFeatureStatus]

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
    chainHopStartTime: selectors.getChainHopStartTime(state),
    portFeatureStatus: selectors.portFeatureStatus(state),
    ongoingImports: selectors.getOngoingImports(state),
    failedImports: selectors.getFailedImports(state),
    coinSymbol: selectors.getCoinSymbol(state)
  })

  return connect(mapStateToProps)(Container)
}

export default withPortState
