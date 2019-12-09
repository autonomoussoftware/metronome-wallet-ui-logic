import { connect } from 'react-redux'
import mapValues from 'lodash/mapValues'
import PropTypes from 'prop-types'
import every from 'lodash/every'
import React from 'react'

import * as selectors from '../selectors'

// Time to wait before updating checklist status (in ms)
// The idea is to prevent fast-loading checklists which would look like a glitch
const MIN_CADENCE = 50

// Time to wait before exiting the loading screen (in ms)
const ON_COMPLETE_DELAY = 20

const withLoadingState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      isMultiChain: PropTypes.bool.isRequired,
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

    setTask = (chainName, taskName) => {
      this.setState(
        state => ({
          ...state,
          [chainName]: {
            ...state[chainName],
            [taskName]: true
          }
        }),
        this.checkFinished
      )
    }

    // eslint-disable-next-line complexity
    checkTasks = () => {
      // eslint-disable-next-line no-unused-vars
      for (const chainName in this.props.chainsStatus) {
        const currentStatus = this.props.chainsStatus[chainName]
        const prevStatus = this.state[chainName] || {}
        if (currentStatus.hasBlockHeight && !prevStatus.hasBlockHeight) {
          this.setTask(chainName, 'hasBlockHeight')
          break
        }
        if (currentStatus.hasCoinRate && !prevStatus.hasCoinRate) {
          this.setTask(chainName, 'hasCoinRate')
          break
        }
        if (currentStatus.hasCoinBalance && !prevStatus.hasCoinBalance) {
          this.setTask(chainName, 'hasCoinBalance')
          break
        }
        if (currentStatus.hasMetBalance && !prevStatus.hasMetBalance) {
          this.setTask(chainName, 'hasMetBalance')
        }
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
          isMultiChain={this.props.isMultiChain}
          chainsStatus={this.state}
        />
      )
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
