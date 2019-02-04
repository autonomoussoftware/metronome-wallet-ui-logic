import smartRounder from 'smart-round'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

import * as selectors from '../selectors'

class FilteredMessage extends React.Component {
  static propTypes = {
    coinSymbol: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    config: PropTypes.shape({
      converterAddress: PropTypes.string.isRequired,
      metTokenAddress: PropTypes.string.isRequired
    }).isRequired
  }

  messageParser(str) {
    const replacements = [
      {
        search: this.props.config.metTokenAddress,
        replaceWith: 'MET TOKEN CONTRACT'
      },
      {
        search: this.props.config.converterAddress,
        replaceWith: 'CONVERTER CONTRACT'
      },
      { search: /(.*gas too low.*)/gim, replaceWith: () => 'Gas too low.' },
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
    return this.messageParser(this.props.children)
  }
}

const mapStateToProps = state => ({
  coinSymbol: selectors.getCoinSymbol(state),
  config: selectors.getActiveChainConfig(state)
})

export default connect(mapStateToProps)(FilteredMessage)
