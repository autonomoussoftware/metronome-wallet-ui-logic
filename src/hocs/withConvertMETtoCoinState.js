import * as validators from '../validators'
import * as selectors from '../selectors'
import { withClient } from './clientContext'
import { connect } from 'react-redux'
import * as utils from '../utils'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import React from 'react'

const withConvertMETtoCoinState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      metDefaultGasLimit: PropTypes.string.isRequired,
      converterPrice: PropTypes.string.isRequired,
      chainGasPrice: PropTypes.string.isRequired,
      availableMET: PropTypes.string.isRequired,
      activeChain: PropTypes.string.isRequired,
      chainConfig: PropTypes.shape({
        chainType: PropTypes.string.isRequired,
        chainId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired
      }).isRequired,
      coinSymbol: PropTypes.string.isRequired,
      walletId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      client: PropTypes.shape({
        getConvertMetEstimate: PropTypes.func.isRequired,
        getConvertMetGasLimit: PropTypes.func.isRequired,
        convertMet: PropTypes.func.isRequired,
        fromCoin: PropTypes.func.isRequired,
        fromWei: PropTypes.func.isRequired,
        toCoin: PropTypes.func.isRequired,
        toWei: PropTypes.func.isRequired
      }).isRequired,
      from: PropTypes.string.isRequired
    }

    static displayName = `withConvertMETtoCoinState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    initialState = {
      gasEstimateError: false,
      estimateError: null,
      useCustomGas: false,
      useMinimum: true,
      metAmount: null,
      gasPrice: this.props.client.fromWei(this.props.chainGasPrice, 'gwei'),
      gasLimit: this.props.metDefaultGasLimit,
      estimate: null,
      errors: {},
      rate: null
    }

    state = this.initialState

    resetForm = () => this.setState(this.initialState)

    componentDidUpdate({ converterPrice }, { metAmount }) {
      // Recalculate estimate if amount or price changed
      if (
        this.props.converterPrice !== converterPrice ||
        this.state.metAmount !== metAmount
      ) {
        this.getConversionEstimate()
      }
    }

    onInputChange = ({ id, value }) => {
      this.setState(state => ({
        ...state,
        gasEstimateError: id === 'gasLimit' ? false : state.gasEstimateError,
        errors: {
          ...state.errors,
          [id]: null,
          useMinimum:
            id === 'estimate' && value !== null ? null : state.errors.useMinimum
        },
        [id]: utils.sanitizeInput(value)
      }))
    }

    getConversionEstimate = debounce(() => {
      const { client, chainConfig } = this.props
      const { metAmount } = this.state

      if (
        !utils.isWeiable(chainConfig, client, metAmount) ||
        !utils.isGreaterThanZero(client, metAmount)
      ) {
        this.setState({ estimateError: null, estimate: null })
        return
      }
      client
        .getConvertMetEstimate({
          value: client.fromCoin(chainConfig, utils.sanitize(metAmount)),
          chain: this.props.activeChain
        })
        .then(({ result }) => {
          const rate = utils.getConversionRate(
            client,
            client.toWei(utils.sanitize(metAmount)),
            result
          )
          this.setState({ estimateError: null, estimate: result, rate })
        })
        .catch(err => {
          this.setState({ estimateError: err.message, estimate: null })
        })
    }, 500)

    onSubmit = password =>
      this.props.client.convertMet({
        minReturn:
          this.state.useMinimum && typeof this.state.estimate === 'string'
            ? this.state.estimate
            : undefined,
        gasPrice: this.props.client.toWei(this.state.gasPrice, 'gwei'),
        walletId: this.props.walletId,
        password,
        value: this.props.client.fromCoin(
          this.props.chainConfig,
          utils.sanitize(this.state.metAmount)
        ),
        chain: this.props.activeChain,
        from: this.props.from,
        gas: this.state.gasLimit
      })

    validate = () => {
      const { metAmount, gasPrice, gasLimit, estimate, useMinimum } = this.state
      const { client, chainConfig } = this.props
      const max = client.fromWei(this.props.availableMET)
      const errors = {
        ...validators.validateMetAmount(chainConfig, client, metAmount, max),
        ...validators.validateGasPrice(chainConfig, client, gasPrice),
        ...validators.validateGasLimit(client, gasLimit),
        ...validators.validateUseMinimum(useMinimum, estimate)
      }
      const hasErrors = Object.keys(errors).length > 0
      if (hasErrors) this.setState({ errors })
      return !hasErrors
    }

    onMaxClick = () => {
      const metAmount = this.props.client.fromWei(this.props.availableMET)
      this.onInputChange({ id: 'metAmount', value: metAmount })
    }

    onUseMinimumToggle = () =>
      this.setState(state => ({
        ...state,
        useMinimum: !state.useMinimum,
        errors: {
          ...state.errors,
          useMinimum: null
        }
      }))

    render() {
      const amountFieldsProps = utils.getAmountFieldsProps({
        metAmount: this.state.metAmount
      })

      return (
        <WrappedComponent
          onUseMinimumToggle={this.onUseMinimumToggle}
          onInputChange={this.onInputChange}
          onMaxClick={this.onMaxClick}
          resetForm={this.resetForm}
          onSubmit={this.onSubmit}
          {...this.props}
          {...this.state}
          metPlaceholder={amountFieldsProps.metPlaceholder}
          metAmount={amountFieldsProps.metAmount}
          validate={this.validate}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    metDefaultGasLimit: selectors.getActiveChainConfig(state)
      .metDefaultGasLimit,
    converterPrice: selectors.getConverterPrice(state),
    chainGasPrice: selectors.getChainGasPrice(state),
    availableMET: selectors.getMetBalanceWei(state),
    chainConfig: selectors.getActiveChainConfig(state),
    activeChain: selectors.getActiveChain(state),
    coinSymbol: selectors.getCoinSymbol(state),
    walletId: selectors.getActiveWalletId(state),
    from: selectors.getActiveAddress(state)
  })

  return connect(mapStateToProps)(withClient(Container))
}

export default withConvertMETtoCoinState
