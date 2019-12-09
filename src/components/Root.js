import { withClient } from '../hocs/clientContext'
import * as selectors from '../selectors'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

class Root extends React.Component {
  static propTypes = {
    OnboardingComponent: PropTypes.elementType.isRequired,
    LoadingComponent: PropTypes.elementType.isRequired,
    RouterComponent: PropTypes.elementType.isRequired,
    isSessionActive: PropTypes.bool.isRequired,
    LoginComponent: PropTypes.elementType.isRequired,
    hasEnoughData: PropTypes.bool.isRequired,
    isMultiChain: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired,
    client: PropTypes.shape({
      onOnboardingCompleted: PropTypes.func.isRequired,
      onLoginSubmit: PropTypes.func.isRequired,
      onStop: PropTypes.func.isRequired,
      onInit: PropTypes.func.isRequired
    }).isRequired
  }

  state = {
    onboardingComplete: null
  }

  componentDidMount() {
    this.props.client
      .onInit()
      .then(({ onboardingComplete, persistedState, config }) => {
        this.props.dispatch({
          type: 'initial-state-received',
          payload: { ...persistedState, config }
        })
        this.setState({ onboardingComplete })
      })
      // eslint-disable-next-line no-console
      .catch(console.warn)
  }

  componentWillUnmount() {
    this.props.client.onStop()
  }

  onOnboardingCompleted = ({ password, mnemonic }) =>
    this.props.client
      .onOnboardingCompleted({ password, mnemonic })
      .then(() => {
        this.setState({ onboardingComplete: true })
        this.props.dispatch({ type: 'session-started' })
      })
      // eslint-disable-next-line no-console
      .catch(console.warn)

  onLoginSubmit = ({ password }) =>
    this.props.client
      .onLoginSubmit({ password })
      .then(() => this.props.dispatch({ type: 'session-started' }))

  render() {
    const {
      OnboardingComponent,
      LoadingComponent,
      RouterComponent,
      isSessionActive,
      LoginComponent,
      hasEnoughData,
      isMultiChain
    } = this.props

    const { onboardingComplete } = this.state

    if (onboardingComplete === null) return null

    // eslint-disable-next-line no-negated-condition
    return !onboardingComplete ? (
      <OnboardingComponent onOnboardingCompleted={this.onOnboardingCompleted} />
    ) : // eslint-disable-next-line no-negated-condition
    !isSessionActive ? (
      <LoginComponent onLoginSubmit={this.onLoginSubmit} />
    ) : hasEnoughData ? (
      <RouterComponent isMultiChain={isMultiChain} />
    ) : (
      <LoadingComponent isMultiChain={isMultiChain} />
    )
  }
}

const mapStateToProps = state => ({
  isSessionActive: selectors.isSessionActive(state),
  hasEnoughData: selectors.hasEnoughData(state),
  isMultiChain: selectors.getIsMultiChain(state)
})

export default connect(mapStateToProps)(withClient(Root))
