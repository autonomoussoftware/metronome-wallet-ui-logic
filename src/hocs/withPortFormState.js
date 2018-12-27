// import { getInitialState } from './withGasEditorState'
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
      availableMet: PropTypes.string.isRequired,
      client: PropTypes.shape({
        getPortGasLimit: PropTypes.func.isRequired,
        portMetronome: PropTypes.func.isRequired,
        fromWei: PropTypes.func.isRequired,
        toWei: PropTypes.func.isRequired
      }).isRequired,
      from: PropTypes.string.isRequired
    }

    static displayName = `withPortFormState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    initialState = {
      metAmount: null,
      // ...getInitialState('MET', this.props.client, this.props.config),
      errors: {}
    }

    state = this.initialState

    resetForm = () => this.setState(this.initialState)

    onInputChange = ({ id, value }) => {
      // const { coinPrice, client } = this.props
      this.setState(state => ({
        ...state,
        // ...utils.syncAmounts({ state, coinPrice, id, value, client }),
        gasEstimateError: id === 'gasLimit' ? false : state.gasEstimateError,
        errors: { ...state.errors, [id]: null },
        [id]: utils.sanitizeInput(value)
      }))

      // Estimate gas limit again if parameters changed
      if (['metAmount'].includes(id)) this.getGasEstimate()
    }

    getGasEstimate = debounce(() => {
      const { metAmount } = this.state

      if (!utils.isWeiable(this.props.client, metAmount)) return

      this.props.client
        .getPortGasLimit({
          value: this.props.client.toWei(utils.sanitize(metAmount)),
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
      this.props.client.portMetronome({
        gasPrice: this.props.client.toWei(this.state.gasPrice, 'gwei'),
        gas: this.state.gasLimit,
        password,
        value: this.props.client.toWei(utils.sanitize(this.state.metAmount)),
        from: this.props.from
      })

    validate = () => {
      const { metAmount, gasPrice, gasLimit } = this.state
      const { client } = this.props
      const max = client.fromWei(this.props.availableMet)
      const errors = {
        ...validators.validateCoinAmount(client, metAmount, max),
        ...validators.validateGasPrice(client, gasPrice),
        ...validators.validateGasLimit(client, gasLimit)
      }
      const hasErrors = Object.keys(errors).length > 0
      if (hasErrors) this.setState({ errors })
      return !hasErrors
    }

    onMaxClick = () => {
      const metAmount = this.props.client.fromWei(this.props.availableMet)
      this.onInputChange({ id: 'metAmount', value: metAmount })
    }

    render() {
      return (
        <WrappedComponent
          onInputChange={this.onInputChange}
          onMaxClick={this.onMaxClick}
          resetForm={this.resetForm}
          onSubmit={this.onSubmit}
          {...this.props}
          {...this.state}
          // metPlaceholder={amountFieldsProps.metPlaceholder}
          // metAmount={amountFieldsProps.metAmount}
          validate={this.validate}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    availableMet: selectors.getMetBalanceWei(state),
    config: selectors.getConfig(state),
    from: selectors.getActiveAddress(state)
  })

  return connect(mapStateToProps)(withClient(Container))
}

export default withPortFormState
