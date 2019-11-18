import * as validators from '../validators'
import * as selectors from '../selectors'
import { withClient } from './clientContext'
import { connect } from 'react-redux'
import * as utils from '../utils'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import React from 'react'

const withPortFormState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      metDefaultGasLimit: PropTypes.string.isRequired,
      availableDestinations: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired
        })
      ).isRequired,
      sourceDisplayName: PropTypes.string.isRequired,
      chainGasPrice: PropTypes.string.isRequired,
      availableMet: PropTypes.string.isRequired,
      chainConfig: PropTypes.shape({
        chainType: PropTypes.string.isRequired,
        chainId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired
      }).isRequired,
      activeChain: PropTypes.string.isRequired,
      walletId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      source: PropTypes.string.isRequired,
      client: PropTypes.shape({
        portMetronome: PropTypes.func.isRequired,
        getPortFees: PropTypes.func.isRequired,
        fromWei: PropTypes.func.isRequired,
        toCoin: PropTypes.func.isRequired,
        toWei: PropTypes.func.isRequired
      }).isRequired,
      from: PropTypes.string.isRequired
    }

    static displayName = `withPortFormState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    getInitialDestination = () => {
      const destinationCandidate = this.props.availableDestinations.find(
        ({ disabledReason }) => !disabledReason
      )
      return destinationCandidate ? destinationCandidate.value : ''
    }

    initialState = {
      gasEstimateError: null,
      useCustomGas: false,
      destination: this.getInitialDestination(),
      metAmount: null,
      gasPrice: this.props.client.fromWei(this.props.chainGasPrice, 'gwei'),
      gasLimit: this.props.metDefaultGasLimit,
      feeError: null,
      errors: {},
      fee: null
    }

    state = this.initialState

    resetForm = () =>
      this.setState({
        ...this.initialState,
        destination: this.getInitialDestination()
      })

    onInputChange = ({ id, value }) => {
      this.setState(state => ({
        ...state,
        gasEstimateError: id === 'gasLimit' ? false : state.gasEstimateError,
        errors: { ...state.errors, [id]: null },
        [id]: utils.sanitizeInput(value)
      }))

      // Estimate gas limit again if parameters changed
      if (['metAmount', 'destination'].includes(id)) this.getEstimates()
    }

    getEstimates = debounce(() => {
      const { metAmount } = this.state

      if (
        !utils.isWeiable(this.props.chainConfig, this.props.client, metAmount)
      ) {
        this.setState({ feeError: null, fee: null })
        return
      }

      this.props.client
        .getPortFees({
          destinationChain: this.state.destination,
          value: this.props.client.toWei(utils.sanitize(metAmount)),
          chain: this.props.activeChain,
          from: this.props.from,
          to: this.props.from
        })
        .then(({ fee, exportGasLimit }) =>
          this.setState({
            gasEstimateError: false,
            gasLimit: exportGasLimit.toString(),
            feeError: null,
            fee
          })
        )
        .catch(err =>
          this.setState({ gasEstimateError: true, feeError: err.message })
        )
    }, 500)

    onSubmit = password =>
      this.props.client.portMetronome({
        destinationChain: this.state.destination,
        gasPrice: this.props.client.toWei(this.state.gasPrice, 'gwei'),
        walletId: this.props.walletId,
        password,
        value: this.props.client.toWei(utils.sanitize(this.state.metAmount)),
        chain: this.props.activeChain,
        from: this.props.from,
        gas: this.state.gasLimit,
        fee: this.state.fee,
        to: this.props.from
      })

    validate = () => {
      const { client, availableMet, chainConfig } = this.props
      const { destination, metAmount, gasPrice, gasLimit } = this.state
      const max = client.toCoin(chainConfig, availableMet)
      const errors = {
        ...validators.validateDestination(destination),
        ...validators.validateMetAmount(chainConfig, client, metAmount, max),
        ...validators.validateGasPrice(chainConfig, client, gasPrice),
        ...validators.validateGasLimit(client, gasLimit)
      }
      const hasErrors = Object.keys(errors).length > 0
      if (hasErrors) this.setState({ errors })
      return !hasErrors
    }

    onMaxClick = () => {
      const metAmount = this.props.client.toCoin(
        this.props.chainConfig,
        this.props.availableMet
      )
      this.onInputChange({ id: 'metAmount', value: metAmount })
    }

    render() {
      return (
        <WrappedComponent
          sourceDisplayName={this.props.sourceDisplayName}
          onInputChange={this.onInputChange}
          onMaxClick={this.onMaxClick}
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
    availableDestinations: selectors.getPortDestinations(state),
    sourceDisplayName: selectors.getActiveChainDisplayName(state),
    chainGasPrice: selectors.getChainGasPrice(state),
    availableMet: selectors.getMetBalanceWei(state),
    chainConfig: selectors.getActiveChainConfig(state),
    activeChain: selectors.getActiveChain(state),
    chainsById: selectors.getChainsById(state),
    walletId: selectors.getActiveWalletId(state),
    source: selectors.getActiveChain(state),
    from: selectors.getActiveAddress(state)
  })

  return connect(mapStateToProps)(withClient(Container))
}

export default withPortFormState
