import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

import { withClient } from './clientContext'
import * as selectors from '../selectors'

const withConverterState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      convertFeatureStatus: PropTypes.oneOf(['offline', 'no-coin', 'ok'])
        .isRequired,
      converterPriceUSD: PropTypes.string.isRequired,
      converterStatus: PropTypes.shape({
        availableCoin: PropTypes.string.isRequired,
        availableMet: PropTypes.string.isRequired
      }),
      lastUpdated: PropTypes.number,
      coinSymbol: PropTypes.string.isRequired,
      client: PropTypes.shape({
        fromWei: PropTypes.func.isRequired
      }).isRequired
    }

    static displayName = `withConverterState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    render() {
      const { convertFeatureStatus, coinSymbol } = this.props

      const convertDisabledReason =
        convertFeatureStatus === 'offline'
          ? "Can't convert while offline"
          : convertFeatureStatus === 'no-coin'
            ? `You need some ${coinSymbol} to pay for conversion gas`
            : null

      return (
        <WrappedComponent
          convertDisabledReason={convertDisabledReason}
          convertDisabled={convertFeatureStatus !== 'ok'}
          {...this.props}
        />
      )
    }
  }

  const mapStateToProps = (state, { client }) => ({
    convertFeatureStatus: selectors.convertFeatureStatus(state),
    converterPriceUSD: selectors.getConverterPriceUSD(state, client),
    converterStatus: selectors.getConverterStatus(state),
    lastUpdated: selectors.getConverterLastUpdated(state),
    coinSymbol: selectors.getCoinSymbol(state)
  })

  return withClient(connect(mapStateToProps)(Container))
}

export default withConverterState
