import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

import * as selectors from '../selectors'

const withOfflineState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      isOnline: PropTypes.bool.isRequired
    }

    static displayName = `withOfflineState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    constructor(props) {
      super(props)
      this.state = {
        isVisible: !props.isOnline
      }
    }

    componentDidUpdate(prevProps, prevState) {
      if (prevState.isVisible && this.props.isOnline) {
        this.setState({ isVisible: false })
      } else if (!this.props.isOnline) {
        this.setState({ isVisible: true })
      }
    }

    handleDismissClick = () => this.setState({ isVisible: false })

    render() {
      return (
        <WrappedComponent
          handleDismissClick={this.handleDismissClick}
          isVisible={this.state.isVisible}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    isOnline: selectors.getIsOnline(state)
  })

  return connect(mapStateToProps)(Container)
}

export default withOfflineState