import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

import * as selectors from '../selectors'
import Timer from '../utils/Timer'

export const ToastsContext = React.createContext({})

const defaults = {
  messagesPerToast: 1,
  autoClose: 6000
}

const withToastsProviderState = (WrappedComponent, preAdd, preRemove) => {
  class Container extends React.Component {
    static propTypes = {
      messagesPerToast: PropTypes.number,
      txSyncStatus: PropTypes.oneOf(['syncing', 'up-to-date', 'failed']),
      autoClose: PropTypes.number,
      lastError: PropTypes.string,
      children: PropTypes.node.isRequired
    }

    static displayName = `withToastsProviderState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    timers = {}

    state = {
      stack: []
    }

    addToast = (type, message, options = {}) => {
      if (!type || !message) return

      const autoClose =
        typeof options.autoClose === 'number'
          ? options.autoClose
          : typeof this.props.autoClose === 'number'
          ? this.props.autoClose
          : defaults.autoClose

      // check if requested type is already visible
      const typeGroup = this.state.stack.find(([typeName]) => typeName === type)

      // only set timer if first message in toast or if toast is not fixed
      if (
        autoClose > 0 &&
        (!typeGroup || (this.timers[type] && this.timers[type].timerId))
      ) {
        this.clearTimeout(type)
        this.timers[type] = new Timer(() => this.removeToast(type), autoClose)
      }

      if (typeof preAdd === 'function') preAdd()
      this.setState(state => ({
        ...state,
        stack: typeGroup
          ? // if type group exists, append message to it
            state.stack.map(([typeName, ...messages]) =>
              typeName === type
                ? // append using Set to automatically avoid duplicates
                  [typeName, ...new Set([...messages, message])]
                : [typeName, ...messages]
            )
          : // if not, append a new type group with the new message
            [...state.stack, [type, message]]
      }))
    }

    removeToast = type => {
      if (typeof preRemove === 'function') preRemove()
      this.setState(state => ({
        ...state,
        stack: state.stack.filter(([typeName]) => typeName !== type)
      }))
    }

    clearTimeout = type => {
      if (this.timers[type]) this.timers[type].stop()
    }

    onDismissClick = type => this.removeToast(type)

    onShowMoreClick = type => this.clearTimeout(type)

    contextValue = { toast: this.addToast, removeToast: this.removeToast }

    componentDidUpdate(prevProps) {
      if (
        this.props.lastError &&
        this.props.lastError !== prevProps.lastError
      ) {
        this.addToast('error', this.props.lastError, { autoClose: 15000 })
      }
      if (
        this.props.txSyncStatus === 'failed' &&
        this.props.txSyncStatus !== prevProps.txSyncStatus
      ) {
        this.addToast('error', 'Could not sync transactions/events')
      }
    }

    render() {
      return (
        <ToastsContext.Provider value={this.contextValue}>
          <WrappedComponent
            messagesPerToast={
              this.props.messagesPerToast || defaults.messagesPerToast
            }
            onShowMoreClick={this.onShowMoreClick}
            onDismissClick={this.onDismissClick}
            stack={this.state.stack}
            toast={this.addToast}
            {...this.props}
          />
        </ToastsContext.Provider>
      )
    }
  }

  const mapStateToProps = state => ({
    txSyncStatus: selectors.getTxSyncStatus(state),
    lastError: selectors.getLastError(state)
  })

  return connect(mapStateToProps)(Container)
}

export default withToastsProviderState
