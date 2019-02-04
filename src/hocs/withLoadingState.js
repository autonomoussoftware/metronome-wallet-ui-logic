import { connect } from 'react-redux'
import mapValues from 'lodash/mapValues'
import PropTypes from 'prop-types'
import every from 'lodash/every'
import React from 'react'

import * as selectors from '../selectors'

// Time to wait before updating checklist status (in ms)
// The idea is to prevent fast-loading checklists which would look like a glitch
const MIN_CADENCE = 200

// Time to wait before exiting the loading screen (in ms)
const ON_COMPLETE_DELAY = 20

const withLoadingState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      chainsStatus: PropTypes.objectOf(
        PropTypes.shape({
          hasBlockHeight: PropTypes.bool.isRequired,
          hasCoinBalance: PropTypes.bool.isRequired,
          hasMetBalance: PropTypes.bool.isRequired,
          displayName: PropTypes.string.isRequired,
          hasCoinRate: PropTypes.bool.isRequired,
          symbol: PropTypes.string.isRequired
        })
      ).isRequired,
      onComplete: PropTypes.func.isRequired
    }

    static displayName = `withLoadingState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    state = mapValues(this.props.chainsStatus, status => ({
      ...status,
      hasBlockHeight: false,
      hasCoinBalance: false,
      hasMetBalance: false,
      hasCoinRate: false
    }))

    checkFinished = () => {
      if (every(this.state, every)) {
        clearInterval(this.interval)
        setTimeout(this.props.onComplete, ON_COMPLETE_DELAY)
      }
    }

    checkTasks = () => {
      mapValues(this.props.chainsStatus, (currentStatus, chainName) => {
        const prevStatus = this.state[chainName] || {}
        if (currentStatus.hasBlockHeight && !prevStatus.hasBlockHeight) {
          return this.setState(
            state => ({
              ...state,
              [chainName]: { ...state[chainName], hasBlockHeight: true }
            }),
            this.checkFinished
          )
        }
        if (currentStatus.hasCoinRate && !prevStatus.hasCoinRate) {
          return this.setState(
            state => ({
              ...state,
              [chainName]: { ...state[chainName], hasCoinRate: true }
            }),
            this.checkFinished,
            this.checkFinished
          )
        }
        if (currentStatus.hasCoinBalance && !prevStatus.hasCoinBalance) {
          return this.setState(
            state => ({
              ...state,
              [chainName]: { ...state[chainName], hasCoinBalance: true }
            }),
            this.checkFinished,
            this.checkFinished
          )
        }
        if (currentStatus.hasMetBalance && !prevStatus.hasMetBalance) {
          return this.setState(
            state => ({
              ...state,
              [chainName]: { ...state[chainName], hasMetBalance: true }
            }),
            this.checkFinished,
            this.checkFinished
          )
        }
      })
    }

    componentDidMount() {
      this.interval = setInterval(this.checkTasks, MIN_CADENCE)
    }

    componentWillUnmount() {
      if (this.interval) clearInterval(this.interval)
    }

    render() {
      return <WrappedComponent chainsStatus={this.state} />
    }
  }

  const mapStateToProps = state => ({
    chainsStatus: selectors.getChainsReadyStatus(state)
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
