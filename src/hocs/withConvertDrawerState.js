import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

import * as selectors from '../selectors'

const withConvertDrawerState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      coinSymbol: PropTypes.string.isRequired
    }

    static displayName = `withConvertDrawerState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    render() {
      return <WrappedComponent {...this.props} />
    }
  }

  const mapStateToProps = state => ({
    coinSymbol: selectors.getCoinSymbol(state)
  })

  return connect(mapStateToProps)(Container)
}

export default withConvertDrawerState
