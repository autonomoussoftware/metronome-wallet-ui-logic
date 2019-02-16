import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import React from 'react'

import * as validators from '../validators'
import * as selectors from '../selectors'
import { withClient } from './clientContext'
import * as utils from '../utils'

const withRetryImportFormState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      metDefaultGasLimit: PropTypes.string.isRequired,
      activeChainConfig: PropTypes.shape({
        metTokenAddress: PropTypes.string.isRequired
      }).isRequired,
      chainGasPrice: PropTypes.string.isRequired,
      activeChain: PropTypes.string.isRequired,
      importData: PropTypes.object,
      walletId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      client: PropTypes.shape({
        getImportGasLimit: PropTypes.func.isRequired,
        retryImport: PropTypes.func.isRequired,
        fromWei: PropTypes.func.isRequired,
        toWei: PropTypes.func.isRequired
      }).isRequired
    }

    static displayName = `withRetryImportFormState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    initialState = {
      gasEstimateError: null,
      useCustomGas: false,
      gasPrice: this.props.client.fromWei(this.props.chainGasPrice, 'gwei'),
      gasLimit: this.props.metDefaultGasLimit,
      errors: {}
    }

    state = this.initialState

    resetForm = () => this.setState(this.initialState)

    onInputChange = ({ id, value }) => {
      this.setState(state => ({
        ...state,
        gasEstimateError: id === 'gasLimit' ? false : state.gasEstimateError,
        errors: { ...state.errors, [id]: null },
        [id]: utils.sanitizeInput(value)
      }))
    }

    getGasEstimate = debounce(() => {
      this.props.client
        .getImportGasLimit({}) // TODO: complete with required params
        .then(({ gasLimit }) =>
          this.setState({
            gasEstimateError: false,
            gasLimit: gasLimit.toString()
          })
        )
        .catch(() => this.setState({ gasEstimateError: true }))
    }, 500)

    onSubmit = password =>
      this.props.client.retryImport({
        ...this.props.importData,
        destinationMetAddress: this.props.activeChainConfig.metTokenAddress,
        gasPrice: this.props.client.toWei(this.state.gasPrice, 'gwei'),
        walletId: this.props.walletId,
        password,
        chain: this.props.activeChain,
        gas: this.state.gasLimit
      })

    validate = () => {
      const { gasPrice, gasLimit } = this.state
      const { client } = this.props
      const errors = {
        ...validators.validateGasPrice(client, gasPrice),
        ...validators.validateGasLimit(client, gasLimit)
      }
      const hasErrors = Object.keys(errors).length > 0
      if (hasErrors) this.setState({ errors })
      return !hasErrors
    }

    render() {
      return (
        <WrappedComponent
          onInputChange={this.onInputChange}
          resetForm={this.resetForm}
          onSubmit={this.onSubmit}
          validate={this.validate}
          {...this.props}
          {...this.state}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    metDefaultGasLimit: selectors.getActiveChainConfig(state)
      .metDefaultGasLimit,
    activeChainConfig: selectors.getActiveChainConfig(state),
    chainGasPrice: selectors.getChainGasPrice(state),
    activeChain: selectors.getActiveChain(state),
    walletId: selectors.getActiveWalletId(state)
  })

  return connect(mapStateToProps)(withClient(Container))
}

export default withRetryImportFormState
