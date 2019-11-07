import * as validators from '../validators'
import { withClient } from './clientContext'
import * as selectors from '../selectors'
import { connect } from 'react-redux'
import * as utils from '../utils'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import React from 'react'

const withSendCoinFormState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      coinDefaultGasLimit: PropTypes.string.isRequired,
      chainGasPrice: PropTypes.string.isRequired,
      availableCoin: PropTypes.string.isRequired,
      activeChain: PropTypes.string.isRequired,
      chainConfig: PropTypes.shape({
        chainType: PropTypes.string.isRequired,
        chainId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired
      }).isRequired,
      coinSymbol: PropTypes.string.isRequired,
      coinPrice: PropTypes.number.isRequired,
      walletId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      useGas: PropTypes.bool.isRequired,
      client: PropTypes.shape({
        getGasLimit: PropTypes.func.isRequired,
        isAddress: PropTypes.func.isRequired,
        sendCoin: PropTypes.func.isRequired,
        fromCoin: PropTypes.func.isRequired,
        fromWei: PropTypes.func.isRequired,
        toCoin: PropTypes.func.isRequired,
        toWei: PropTypes.func.isRequired
      }).isRequired,
      from: PropTypes.string.isRequired
    }

    static displayName = `withSendCoinFormState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    initialState = {
      gasEstimateError: false,
      useCustomGas: false,
      coinAmount: null,
      usdAmount: null,
      toAddress: null,
      gasPrice: this.props.client.fromWei(this.props.chainGasPrice, 'gwei'),
      gasLimit: this.props.coinDefaultGasLimit,
      errors: {}
    }

    state = this.initialState

    resetForm = () => this.setState(this.initialState)

    onInputChange = ({ id, value }) => {
      const { coinPrice, client, useGas } = this.props
      this.setState(state => ({
        ...state,
        ...utils.syncAmounts({ state, coinPrice, id, value, client }),
        gasEstimateError: id === 'gasLimit' ? false : state.gasEstimateError,
        errors: { ...state.errors, [id]: null },
        [id]: utils.sanitizeInput(value)
      }))

      // Estimate gas limit again if parameters changed
      if (useGas && ['coinAmount'].includes(id)) {
        this.getGasEstimate()
      }
    }

    getGasEstimate = debounce(() => {
      const { coinAmount, toAddress } = this.state

      if (
        !this.props.client.isAddress(this.props.chainConfig, toAddress) ||
        !utils.isWeiable(this.props.client, coinAmount)
      ) {
        return
      }

      this.props.client
        .getGasLimit({
          value: this.props.client.toWei(utils.sanitize(coinAmount)),
          chain: this.props.activeChain,
          from: this.props.from,
          to: this.state.toAddress
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
      this.props.client.sendCoin({
        gasPrice: this.props.client.toWei(this.state.gasPrice, 'gwei'),
        walletId: this.props.walletId,
        password,
        value: this.props.client.fromCoin(
          this.props.chainConfig,
          utils.sanitize(this.state.coinAmount)
        ),
        chain: this.props.activeChain,
        from: this.props.from,
        gas: this.state.gasLimit,
        to: this.state.toAddress
      })

    validate = () => {
      const { coinAmount, toAddress, gasPrice, gasLimit } = this.state
      const { client, useGas, chainConfig } = this.props
      const max = client.toCoin(chainConfig, this.props.availableCoin)
      const errors = {
        ...validators.validateToAddress(chainConfig, client, toAddress),
        ...validators.validateCoinAmount(chainConfig, client, coinAmount, max),
        ...(useGas ? validators.validateGasPrice(client, gasPrice) : {}),
        ...(useGas ? validators.validateGasLimit(client, gasLimit) : {})
      }
      const hasErrors = Object.keys(errors).length > 0
      if (hasErrors) this.setState({ errors })
      return !hasErrors
    }

    onMaxClick = () => {
      const coinAmount = this.props.client.toCoin(
        this.props.chainConfig,
        this.props.availableCoin
      )
      this.onInputChange({ id: 'coinAmount', value: coinAmount })
    }

    render() {
      const amountFieldsProps = utils.getAmountFieldsProps({
        coinAmount: this.state.coinAmount,
        usdAmount: this.state.usdAmount
      })

      return (
        <WrappedComponent
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
    coinDefaultGasLimit: selectors.getActiveChainConfig(state)
      .coinDefaultGasLimit,
    addressPlaceholder: selectors.getAddressPlaceholder(state),
    chainGasPrice: selectors.getChainGasPrice(state),
    availableCoin: selectors.getCoinBalanceWei(state),
    chainConfig: selectors.getActiveChainConfig(state),
    activeChain: selectors.getActiveChain(state),
    coinSymbol: selectors.getCoinSymbol(state),
    coinPrice: selectors.getCoinRate(state),
    walletId: selectors.getActiveWalletId(state),
    useGas: selectors.getActiveChainConfig(state).chainType === 'ethereum',
    from: selectors.getActiveAddress(state)
  })

  return connect(mapStateToProps)(withClient(Container))
}

export default withSendCoinFormState
