import * as selectors from '../selectors'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

const withChainSelectorState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      onChainChange: PropTypes.func.isRequired,
      activeChain: PropTypes.string.isRequired,
      chains: PropTypes.arrayOf(
        PropTypes.shape({
          displayName: PropTypes.string.isRequired,
          balance: PropTypes.string.isRequired,
          id: PropTypes.string.isRequired
        })
      ).isRequired
    }

    static displayName = `withChainSelectorState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    render() {
      return <WrappedComponent {...this.props} />
    }
  }

  const mapStateToProps = state => ({
    activeChain: selectors.getActiveChain(state),
    chains: selectors.getChainsWithBalances(state)
  })

  const mapDispatchToProps = dispatch => ({
    onChainChange: chainName =>
      dispatch({ type: 'active-chain-changed', payload: chainName })
  })

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(Container)
}

export default withChainSelectorState
