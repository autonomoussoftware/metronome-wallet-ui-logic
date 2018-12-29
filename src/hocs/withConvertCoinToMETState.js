import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import React from 'react'

import * as validators from '../validators'
import * as selectors from '../selectors'
import { withClient } from './clientContext'
import * as utils from '../utils'

const withConvertCoinToMETState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      coinDefaultGasLimit: PropTypes.string.isRequired,
      converterPrice: PropTypes.string.isRequired,
      availableCoin: PropTypes.string.isRequired,
      chainGasPrice: PropTypes.string.isRequired,
      coinPrice: PropTypes.number.isRequired,
      client: PropTypes.shape({
        getConvertCoinEstimate: PropTypes.func.isRequired,
        getConvertCoinGasLimit: PropTypes.func.isRequired,
        convertCoin: PropTypes.func.isRequired,
        fromWei: PropTypes.func.isRequired,
        toWei: PropTypes.func.isRequired
      }).isRequired,
      from: PropTypes.string.isRequired
    }

    static displayName = `withConvertCoinToMETState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    initialState = {
      gasEstimateError: false,
      estimateError: null,
      useCustomGas: false,
      useMinimum: true,
      coinAmount: null,
      usdAmount: null,
      gasPrice: this.props.client.fromWei(this.props.chainGasPrice, 'gwei'),
      gasLimit: this.props.coinDefaultGasLimit,
      estimate: null,
      errors: {},
      rate: null
    }

    state = this.initialState

    resetForm = () => this.setState(this.initialState)

    componentDidUpdate({ converterPrice }, { coinAmount }) {
      // Recalculate estimate if amount or price changed
      if (
        this.props.converterPrice !== converterPrice ||
        this.state.coinAmount !== coinAmount
      ) {
        this.getConversionEstimate()
      }
    }

    onInputChange = ({ id, value }) => {
      const { coinPrice, client } = this.props
      this.setState(state => ({
        ...state,
        ...utils.syncAmounts({ state, coinPrice, id, value, client }),
        gasEstimateError: id === 'gasLimit' ? false : state.gasEstimateError,
        errors: {
          ...state.errors,
          [id]: null,
          useMinimum:
            id === 'estimate' && value !== null ? null : state.errors.useMinimum
        },
        [id]: utils.sanitizeInput(value)
      }))

      // Estimate gas limit again if parameters changed
      if (['coinAmount'].includes(id)) this.getGasEstimate()
    }

    getGasEstimate = debounce(() => {
      const { coinAmount } = this.state

      if (!utils.isWeiable(this.props.client, coinAmount)) return

      this.props.client
        .getConvertCoinGasLimit({
          value: this.props.client.toWei(utils.sanitize(coinAmount)),
          from: this.props.from
        })
        .then(({ gasLimit }) =>
          this.setState({
            gasEstimateError: false,
            gasLimit: gasLimit.toString()
          })
        )
        .catch(() => this.setState({ gasEstimateError: true }))
    }, 500)

    getConversionEstimate = debounce(() => {
      const { coinAmount } = this.state
      const { client } = this.props

      if (
        !utils.isWeiable(client, coinAmount) ||
        !utils.isGreaterThanZero(client, coinAmount)
      ) {
        return this.setState({ estimateError: null, estimate: null })
      }
      client
        .getConvertCoinEstimate({
          value: client.toWei(utils.sanitize(coinAmount))
        })
        .then(({ result }) => {
          const rate = utils.getConversionRate(
            client,
            result,
            client.toWei(utils.sanitize(coinAmount))
          )
          this.setState({ estimateError: null, estimate: result, rate })
        })
        .catch(err => {
          this.setState({ estimateError: err.message, estimate: null })
        })
    }, 500)

    onSubmit = password =>
      this.props.client.convertCoin({
        minReturn:
          this.state.useMinimum && typeof this.state.estimate === 'string'
            ? this.state.estimate
            : undefined,
        gasPrice: this.props.client.toWei(this.state.gasPrice, 'gwei'),
        gas: this.state.gasLimit,
        password,
        value: this.props.client.toWei(utils.sanitize(this.state.coinAmount)),
        from: this.props.from
      })

    validate = () => {
      const {
        coinAmount,
        gasPrice,
        gasLimit,
        useMinimum,
        estimate
      } = this.state
      const { client } = this.props
      const max = client.fromWei(this.props.availableCoin)
      const errors = {
        ...validators.validateCoinAmount(client, coinAmount, max),
        ...validators.validateGasPrice(client, gasPrice),
        ...validators.validateGasLimit(client, gasLimit),
        ...validators.validateUseMinimum(useMinimum, estimate)
      }
      const hasErrors = Object.keys(errors).length > 0
      if (hasErrors) this.setState({ errors })
      return !hasErrors
    }

    onMaxClick = () => {
      const coinAmount = this.props.client.fromWei(this.props.availableCoin)
      this.onInputChange({ id: 'coinAmount', value: coinAmount })
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
        coinAmount: this.state.coinAmount,
        usdAmount: this.state.usdAmount
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
          coinPlaceholder={amountFieldsProps.coinPlaceholder}
          usdPlaceholder={amountFieldsProps.usdPlaceholder}
          coinAmount={amountFieldsProps.coinAmount}
          usdAmount={amountFieldsProps.usdAmount}
          validate={this.validate}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    cointDefaultGasLimit: selectors.getActiveChainConfig(state)
      .cointDefaultGasLimit,
    converterPrice: selectors.getConverterPrice(state),
    availableCoin: selectors.getCoinBalanceWei(state),
    chainGasPrice: selectors.getChainGasPrice(state),
    coinPrice: selectors.getCoinRate(state),
    from: selectors.getActiveAddress(state)
  })

  return connect(mapStateToProps)(withClient(Container))
}

export default withConvertCoinToMETState
