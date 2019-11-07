import * as validators from '../validators'
import { withClient } from './clientContext'
import * as selectors from '../selectors'
import { connect } from 'react-redux'
import * as utils from '../utils'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import React from 'react'

const withSendMETFormState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      metDefaultGasLimit: PropTypes.string.isRequired,
      metTokenAddress: PropTypes.string.isRequired,
      chainGasPrice: PropTypes.string.isRequired,
      availableMET: PropTypes.string.isRequired,
      activeChain: PropTypes.string.isRequired,
      chainConfig: PropTypes.shape({
        chainType: PropTypes.string.isRequired,
        chainId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired
      }).isRequired,
      walletId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      client: PropTypes.shape({
        getTokensGasLimit: PropTypes.func.isRequired,
        isAddress: PropTypes.func.isRequired,
        sendMet: PropTypes.func.isRequired,
        fromWei: PropTypes.func.isRequired,
        toWei: PropTypes.func.isRequired
      }).isRequired,
      from: PropTypes.string.isRequired
    }

    static displayName = `withSendMETFormState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    initialState = {
      gasEstimateError: false,
      useCustomGas: false,
      toAddress: null,
      metAmount: null,
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

      // Estimate gas limit again if parameters changed
      if (['toAddress', 'metAmount'].includes(id)) this.getGasEstimate()
    }

    getGasEstimate = debounce(() => {
      const { metAmount, toAddress } = this.state

      if (
        !this.props.client.isAddress(this.props.chainConfig, toAddress) ||
        !utils.isWeiable(this.props.client, metAmount)
      ) {
        return
      }

      this.props.client
        .getTokensGasLimit({
          value: this.props.client.toWei(utils.sanitize(metAmount)),
          token: this.props.metTokenAddress,
          chain: this.props.activeChain,
          from: this.props.from,
          to: toAddress
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
      this.props.client.sendMet({
        gasPrice: this.props.client.toWei(this.state.gasPrice, 'gwei'),
        password,
        walletId: this.props.walletId,
        value: this.props.client.toWei(utils.sanitize(this.state.metAmount)),
        chain: this.props.activeChain,
        from: this.props.from,
        gas: this.state.gasLimit,
        to: this.state.toAddress
      })

    validate = () => {
      const { metAmount, toAddress, gasPrice, gasLimit } = this.state
      const { client } = this.props
      const max = client.fromWei(this.props.availableMET)
      const errors = {
        ...validators.validateToAddress(client, toAddress),
        ...validators.validateMetAmount(client, metAmount, max),
        ...validators.validateGasPrice(client, gasPrice),
        ...validators.validateGasLimit(client, gasLimit)
      }
      const hasErrors = Object.keys(errors).length > 0
      if (hasErrors) this.setState({ errors })
      return !hasErrors
    }

    onMaxClick = () => {
      const metAmount = this.props.client.fromWei(this.props.availableMET)
      this.onInputChange({ id: 'metAmount', value: metAmount })
    }

    render() {
      const amountFieldsProps = utils.getAmountFieldsProps({
        metAmount: this.state.metAmount
      })

      return (
        <WrappedComponent
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
    metTokenAddress: selectors.getActiveChainConfig(state).metTokenAddress,
    chainGasPrice: selectors.getChainGasPrice(state),
    availableMET: selectors.getMetBalanceWei(state),
    chainConfig: selectors.getActiveChainConfig(state),
    activeChain: selectors.getActiveChain(state),
    walletId: selectors.getActiveWalletId(state),
    from: selectors.getActiveAddress(state)
  })

  return connect(mapStateToProps)(withClient(Container))
}

export default withSendMETFormState
