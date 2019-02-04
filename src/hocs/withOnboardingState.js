import * as validators from '../validators'
import { withClient } from './clientContext'
import * as selectors from '../selectors'
import { connect } from 'react-redux'
import * as utils from '../utils'
import PropTypes from 'prop-types'
import React from 'react'

const withOnboardingState = WrappedComponent => {
  class Container extends React.Component {
    static propTypes = {
      onOnboardingCompleted: PropTypes.func.isRequired,
      client: PropTypes.shape({
        onTermsLinkClick: PropTypes.func.isRequired,
        getStringEntropy: PropTypes.func.isRequired,
        isValidMnemonic: PropTypes.func.isRequired,
        createMnemonic: PropTypes.func.isRequired
      }).isRequired,
      config: PropTypes.shape({
        requiredPasswordEntropy: PropTypes.number.isRequired
      }).isRequired
    }

    static displayName = `withOnboardingState(${WrappedComponent.displayName ||
      WrappedComponent.name})`

    state = {
      isPasswordDefined: false,
      areTermsAccepted: false,
      isMnemonicCopied: false,
      useUserMnemonic: false,
      licenseCheckbox: false,
      termsCheckbox: false,
      passwordAgain: null,
      mnemonicAgain: null,
      userMnemonic: null,
      password: null,
      mnemonic: null,
      errors: {}
    }

    componentDidMount() {
      this.props.client
        .createMnemonic()
        .then(mnemonic => this.setState({ mnemonic }))
    }

    onTermsAccepted = () => {
      if (this.state.licenseCheckbox && this.state.termsCheckbox) {
        this.setState({ areTermsAccepted: true })
      }
    }

    onPasswordSubmit = ({ clearOnError = false }) => {
      const { password, passwordAgain } = this.state

      const errors = validators.validatePasswordCreation(
        this.props.client,
        this.props.config,
        password
      )
      if (!errors.password && !passwordAgain) {
        errors.passwordAgain = `Repeat the ${clearOnError ? 'PIN' : 'password'}`
      } else if (!errors.password && passwordAgain !== password) {
        errors.passwordAgain = `${
          clearOnError ? 'PINs' : 'Passwords'
        } don't match`
      }
      if (Object.keys(errors).length > 0) {
        return this.setState({
          passwordAgain: clearOnError ? '' : passwordAgain,
          errors
        })
      }
      this.setState({ isPasswordDefined: true })
    }

    onUseUserMnemonicToggled = () => {
      this.setState(state => ({
        ...state,
        useUserMnemonic: !state.useUserMnemonic,
        userMnemonic: null,
        errors: {
          ...state.errors,
          userMnemonic: null
        }
      }))
    }

    onMnemonicCopiedToggled = () => {
      this.setState(state => ({
        ...state,
        isMnemonicCopied: !state.isMnemonicCopied,
        mnemonicAgain: null,
        errors: {
          ...state.errors,
          mnemonicAgain: null
        }
      }))
    }

    onMnemonicAccepted = e => {
      if (e && e.preventDefault) e.preventDefault()

      const errors = this.state.useUserMnemonic
        ? validators.validateMnemonic(
            this.props.client,
            this.state.userMnemonic,
            'userMnemonic'
          )
        : validators.validateMnemonicAgain(
            this.props.client,
            this.state.mnemonic,
            this.state.mnemonicAgain
          )

      if (Object.keys(errors).length > 0) return this.setState({ errors })

      return this.props.onOnboardingCompleted({
        password: this.state.password,
        mnemonic: this.state.useUserMnemonic
          ? utils.sanitizeMnemonic(this.state.userMnemonic)
          : this.state.mnemonic
      })
    }

    onInputChange = ({ id, value }) => {
      this.setState(state => ({
        ...state,
        [id]: value,
        errors: {
          ...state.errors,
          [id]: null
        }
      }))
    }

    getCurrentStep() {
      if (!this.state.areTermsAccepted) return 'ask-for-terms'
      if (!this.state.isPasswordDefined) return 'define-password'
      if (this.state.useUserMnemonic) return 'recover-from-mnemonic'
      if (this.state.isMnemonicCopied) return 'verify-mnemonic'
      return 'copy-mnemonic'
    }

    render() {
      const getWordsAmount = phrase =>
        utils.sanitizeMnemonic(phrase || '').split(' ').length

      const shouldSubmit = phrase => getWordsAmount(phrase) === 12

      const getTooltip = phrase =>
        shouldSubmit(phrase)
          ? null
          : 'A recovery phrase must have exactly 12 words'

      return (
        <WrappedComponent
          onUseUserMnemonicToggled={this.onUseUserMnemonicToggled}
          requiredPasswordEntropy={this.props.config.requiredPasswordEntropy}
          onMnemonicCopiedToggled={this.onMnemonicCopiedToggled}
          onMnemonicAccepted={this.onMnemonicAccepted}
          onTermsLinkClick={this.props.client.onTermsLinkClick}
          onPasswordSubmit={this.onPasswordSubmit}
          onTermsAccepted={this.onTermsAccepted}
          onInputChange={this.onInputChange}
          shouldSubmit={shouldSubmit}
          currentStep={this.getCurrentStep()}
          getTooltip={getTooltip}
          {...this.state}
        />
      )
    }
  }

  const mapStateToProps = state => ({
    config: selectors.getConfig(state)
  })

  return connect(mapStateToProps)(withClient(Container))
}

export default withOnboardingState
