import * as selectors from '../selectors'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

// Time to wait before updating checklist status (in ms)
// The idea is to prevent fast-loading checklists which would look like a glitch
const MIN_CADENCE = 200

// Time to wait before exiting the loading screen (in ms)
const ON_COMPLETE_DELAY = 20

const withLoadingState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      hasBlockHeight: PropTypes.bool.isRequired,
      hasCoinBalance: PropTypes.bool.isRequired,
      hasMetBalance: PropTypes.bool.isRequired,
      hasCoinRate: PropTypes.bool.isRequired,
      onComplete: PropTypes.func.isRequired
    }

    static displayName = `withLoadingState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    state = {
      hasBlockHeight: false,
      hasCoinBalance: false,
      hasMetBalance: false,
      hasCoinRate: false
    }

    checkFinished = () => {
      const {
        hasBlockHeight,
        hasCoinBalance,
        hasMetBalance,
        hasCoinRate
      } = this.state

      if (hasBlockHeight && hasCoinBalance && hasMetBalance && hasCoinRate) {
        clearInterval(this.interval)
        setTimeout(this.props.onComplete, ON_COMPLETE_DELAY)
      }
    }

    checkTasks = () => {
      const {
        hasBlockHeight,
        hasCoinBalance,
        hasMetBalance,
        hasCoinRate
      } = this.state

      if (this.props.hasBlockHeight && !hasBlockHeight) {
        return this.setState({ hasBlockHeight: true }, this.checkFinished)
      }
      if (this.props.hasCoinRate && !hasCoinRate) {
        return this.setState({ hasCoinRate: true }, this.checkFinished)
      }
      if (this.props.hasCoinBalance && !hasCoinBalance) {
        return this.setState({ hasCoinBalance: true }, this.checkFinished)
      }
      if (this.props.hasMetBalance && !hasMetBalance) {
        return this.setState({ hasMetBalance: true }, this.checkFinished)
      }
    }

    componentDidMount() {
      this.interval = setInterval(this.checkTasks, MIN_CADENCE)
    }

    componentWillUnmount() {
      if (this.interval) clearInterval(this.interval)
    }

    render() {
      return (
        <WrappedComponent
          hasBlockHeight={this.state.hasBlockHeight}
          hasCoinBalance={this.state.hasCoinBalance}
          hasMetBalance={this.state.hasMetBalance}
          hasCoinRate={this.state.hasCoinRate}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    hasBlockHeight: selectors.getBlockHeight(state) > -1,
    hasCoinBalance: selectors.getActiveWalletCoinBalance(state) !== null,
    hasMetBalance: selectors.getActiveWalletMetBalance(state) !== null,
    hasCoinRate: selectors.getCoinRate(state) !== null
  })

  const mapDispatchToProps = dispatch => ({
    onComplete: () => dispatch({ type: 'required-data-gathered' })
  })

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(Container)
}

export default withLoadingState
