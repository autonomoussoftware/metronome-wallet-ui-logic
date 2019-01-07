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
      coinPrice: PropTypes.number.isRequired,
      walletId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      client: PropTypes.shape({
        getGasLimit: PropTypes.func.isRequired,
        isAddress: PropTypes.func.isRequired,
        sendCoin: PropTypes.func.isRequired,
        fromWei: PropTypes.func.isRequired,
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
      const { coinPrice, client } = this.props
      this.setState(state => ({
        ...state,
        ...utils.syncAmounts({ state, coinPrice, id, value, client }),
        gasEstimateError: id === 'gasLimit' ? false : state.gasEstimateError,
        errors: { ...state.errors, [id]: null },
        [id]: utils.sanitizeInput(value)
      }))

      // Estimate gas limit again if parameters changed
      if (['coinAmount'].includes(id)) this.getGasEstimate()
    }

    getGasEstimate = debounce(() => {
      const { coinAmount, toAddress } = this.state

      if (
        !this.props.client.isAddress(toAddress) ||
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
        value: this.props.client.toWei(utils.sanitize(this.state.coinAmount)),
        chain: this.props.activeChain,
        from: this.props.from,
        gas: this.state.gasLimit,
        to: this.state.toAddress
      })

    validate = () => {
      const { coinAmount, toAddress, gasPrice, gasLimit } = this.state
      const { client } = this.props
      const max = client.fromWei(this.props.availableCoin)
      const errors = {
        ...validators.validateToAddress(client, toAddress),
        ...validators.validateCoinAmount(client, coinAmount, max),
        ...validators.validateGasPrice(client, gasPrice),
        ...validators.validateGasLimit(client, gasLimit)
      }
      const hasErrors = Object.keys(errors).length > 0
      if (hasErrors) this.setState({ errors })
      return !hasErrors
    }

    onMaxClick = () => {
      const coinAmount = this.props.client.fromWei(this.props.availableCoin)
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
    chainGasPrice: selectors.getChainGasPrice(state),
    availableCoin: selectors.getCoinBalanceWei(state),
    activeChain: selectors.getActiveChain(state),
    coinPrice: selectors.getCoinRate(state),
    walletId: selectors.getActiveWalletId(state),
    from: selectors.getActiveAddress(state)
  })

  return connect(mapStateToProps)(withClient(Container))
}

export default withSendCoinFormState
