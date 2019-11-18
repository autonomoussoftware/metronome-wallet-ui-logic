import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import moment from 'moment'
import React from 'react'
import get from 'lodash/get'

import * as validators from '../validators'
import { withClient } from './clientContext'
import * as selectors from '../selectors'
import * as utils from '../utils'

const withRetryImportFormState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      chainsConfigBySymbol: PropTypes.objectOf(
        PropTypes.shape({
          displayName: PropTypes.string.isRequired
        })
      ).isRequired,
      metDefaultGasLimit: PropTypes.string.isRequired,
      activeChainConfig: PropTypes.shape({
        metTokenAddress: PropTypes.string.isRequired
      }).isRequired,
      chainGasPrice: PropTypes.string.isRequired,
      chainConfig: PropTypes.shape({
        chainType: PropTypes.string.isRequired,
        chainId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired
      }).isRequired,
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

    componentDidUpdate(prevProps) {
      const nextHash = get(this.props, 'importData.currentBurnHash', '')
      const prevHash = get(prevProps, 'importData.currentBurnHash', '')
      if (prevHash !== nextHash) {
        this.getGasEstimate()
      }
    }

    getGasEstimate = debounce(() => {
      this.props.client
        .getImportGasLimit({
          ...this.props.importData,
          destinationMetAddress: this.props.activeChainConfig.metTokenAddress,
          chain: this.props.activeChain
        })
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
      const { client, chainConfig } = this.props
      const { gasPrice, gasLimit } = this.state
      const errors = {
        ...validators.validateGasPrice(chainConfig, client, gasPrice),
        ...validators.validateGasLimit(client, gasLimit)
      }
      const hasErrors = Object.keys(errors).length > 0
      if (hasErrors) this.setState({ errors })
      return !hasErrors
    }

    render() {
      const { importData, chainsConfigBySymbol, ...otherProps } = this.props

      const destinationChain = get(importData, 'destinationChain', '')
      const originChain = get(importData, 'originChain', '')
      const destinationDisplayName = get(
        chainsConfigBySymbol,
        [destinationChain, 'displayName'],
        ''
      )
      const originDisplayName = get(
        chainsConfigBySymbol,
        [originChain, 'displayName'],
        ''
      )
      const timestamp = get(importData, 'blockTimestamp', '')
      const formattedTime = timestamp
        ? moment.unix(timestamp).format('LLLL')
        : ''

      return (
        <WrappedComponent
          destinationDisplayName={destinationDisplayName}
          originDisplayName={originDisplayName}
          onInputChange={this.onInputChange}
          formattedTime={formattedTime}
          resetForm={this.resetForm}
          timestamp={parseInt(timestamp, 10)}
          onSubmit={this.onSubmit}
          validate={this.validate}
          value={importData ? importData.value : ''}
          fee={importData ? importData.fee : ''}
          {...otherProps}
          {...this.state}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    chainsConfigBySymbol: selectors.getChainsConfigBySymbol(state),
    metDefaultGasLimit: selectors.getActiveChainConfig(state)
      .metDefaultGasLimit,
    activeChainConfig: selectors.getActiveChainConfig(state),
    chainGasPrice: selectors.getChainGasPrice(state),
    chainConfig: selectors.getActiveChainConfig(state),
    activeChain: selectors.getActiveChain(state),
    walletId: selectors.getActiveWalletId(state)
  })

  return connect(mapStateToProps)(withClient(Container))
}

export default withRetryImportFormState
