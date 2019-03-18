import smartRounder from 'smart-round'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

import * as selectors from '../selectors'

class FilteredMessage extends React.Component {
  static propTypes = {
    withDefault: PropTypes.func,
    coinSymbol: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    config: PropTypes.shape({
      tokenPorterAddress: PropTypes.string.isRequired,
      validatorAddress: PropTypes.string.isRequired,
      converterAddress: PropTypes.string.isRequired,
      metTokenAddress: PropTypes.string.isRequired
    }).isRequired
  }

  static defaultProps = {
    withDefault: t => t
  }

  messageParser(str) {
    const replacements = [
      {
        search: this.props.config.tokenPorterAddress,
        replaceWith: 'MET PORTER CONTRACT'
      },
      {
        search: this.props.config.validatorAddress,
        replaceWith: 'PORT VALIDATOR CONTRACT'
      },
      {
        search: this.props.config.metTokenAddress,
        replaceWith: 'MET TOKEN CONTRACT'
      },
      {
        search: this.props.config.converterAddress,
        replaceWith: 'CONVERTER CONTRACT'
      },
      { search: /(.*gas too low.*)/gi, replaceWith: () => 'Gas too low.' },
      {
        search: /[\s\S]*Transaction has been reverted by the EVM[\s\S]*/gi,
        replaceWith: () => 'Transaction failed'
      },
      {
        search: /[\s\S]*CONNECTION TIMEOUT[\s\S]*/gi,
        replaceWith: () => 'Connection timeout'
      },
      {
        search: /[\s\S]*Couldn't connect to node on WS[\s\S]*/gi,
        replaceWith: () => `Couldn't connect to blockchain node`
      },
      {
        search: /(.*insufficient funds for gas \* price \+ value.*)/gim,
        replaceWith: () => "You don't have enough funds for this transaction."
      },
      {
        search: /(.*Insufficient\sfunds.*Required\s)(\d+)(\sand\sgot:\s)(\d+)(.*)/gim,
        // eslint-disable-next-line max-params
        replaceWith: (match, p1, p2, p3, p4, p5) => {
          const rounder = smartRounder(6, 0, 18)
          return [
            p1,
            rounder(p2, true),
            ` ${this.props.coinSymbol}`,
            p3,
            rounder(p4, true),
            ` ${this.props.coinSymbol}`,
            p5
          ].join('')
        }
      }
    ]

    return replacements.reduce(
      (output, { search, replaceWith }) => output.replace(search, replaceWith),
      str
    )
  }

  render() {
    const filteredMessage = this.messageParser(this.props.children)

    return filteredMessage === this.props.children
      ? this.props.withDefault(this.props.children)
      : filteredMessage
  }
}

const mapStateToProps = state => ({
  coinSymbol: selectors.getCoinSymbol(state),
  config: selectors.getActiveChainConfig(state)
})

export default connect(mapStateToProps)(FilteredMessage)
