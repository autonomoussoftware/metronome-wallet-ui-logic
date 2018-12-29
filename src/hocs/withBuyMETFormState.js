import * as validators from '../validators'
import * as selectors from '../selectors'
import { withClient } from './clientContext'
import { connect } from 'react-redux'
import * as utils from '../utils'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import React from 'react'

const withBuyMETFormState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      metDefaultGasLimit: PropTypes.string.isRequired,
      tokenRemaining: PropTypes.string.isRequired,
      availableCoin: PropTypes.string.isRequired,
      chainGasPrice: PropTypes.string.isRequired,
      currentPrice: PropTypes.string.isRequired,
      coinPrice: PropTypes.number.isRequired,
      client: PropTypes.shape({
        getAuctionGasLimit: PropTypes.func.isRequired,
        buyMetronome: PropTypes.func.isRequired,
        fromWei: PropTypes.func.isRequired,
        toWei: PropTypes.func.isRequired,
        toBN: PropTypes.func.isRequired
      }).isRequired,
      from: PropTypes.string.isRequired
    }

    static displayName = `withBuyMETFormState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    initialState = {
      gasEstimateError: false,
      useCustomGas: false,
      coinAmount: null,
      usdAmount: null,
      gasPrice: this.props.client.fromWei(this.props.chainGasPrice, 'gwei'),
      gasLimit: this.props.metDefaultGasLimit,
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
      const { coinAmount } = this.state

      if (!utils.isWeiable(this.props.client, coinAmount)) return

      this.props.client
        .getAuctionGasLimit({
          value: this.props.client.toWei(utils.sanitize(coinAmount)),
          from: this.props.from
        })
        .then(({ gasLimit }) => {
          this.setState({
            gasEstimateError: false,
            gasLimit: gasLimit.toString()
          })
        })
        .catch(() => this.setState({ gasEstimateError: true }))
    }, 500)

    onSubmit = password =>
      this.props.client.buyMetronome({
        gasPrice: this.props.client.toWei(this.state.gasPrice, 'gwei'),
        gas: this.state.gasLimit,
        password,
        value: this.props.client.toWei(utils.sanitize(this.state.coinAmount)),
        from: this.props.from
      })

    validate = () => {
      const { coinAmount, gasPrice, gasLimit } = this.state
      const { client } = this.props
      const max = client.fromWei(this.props.availableCoin)
      const errors = {
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

      const expected = utils.getPurchaseEstimate({
        remaining: this.props.tokenRemaining,
        amount: this.state.coinAmount,
        client: this.props.client,
        rate: this.props.currentPrice
      })

      return (
        <WrappedComponent
          onInputChange={this.onInputChange}
          onMaxClick={this.onMaxClick}
          resetForm={this.resetForm}
          onSubmit={this.onSubmit}
          {...this.props}
          {...this.state}
          {...expected}
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
    metDefaultGasLimit: selectors.getActiveChainConfig(state)
      .metDefaultGasLimit,
    tokenRemaining: selectors.getAuctionStatus(state).tokenRemaining,
    availableCoin: selectors.getCoinBalanceWei(state),
    chainGasPrice: selectors.getChainGasPrice(state),
    currentPrice: selectors.getAuctionStatus(state).currentPrice,
    coinPrice: selectors.getCoinRate(state),
    from: selectors.getActiveAddress(state)
  })

  return connect(mapStateToProps)(withClient(Container))
}

export default withBuyMETFormState
