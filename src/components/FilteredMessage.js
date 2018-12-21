import smartRounder from 'smart-round'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import React from 'react'

import * as selectors from '../selectors'

class FilteredMessage extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    config: PropTypes.shape({
      MET_TOKEN_ADDR: PropTypes.string.isRequired,
      CONVERTER_ADDR: PropTypes.string.isRequired
    }).isRequired
  }

  messageParser(config, str) {
    const replacements = [
      {
        search: this.props.config.MET_TOKEN_ADDR,
        replaceWith: 'MET TOKEN CONTRACT'
      },
      {
        search: this.props.config.CONVERTER_ADDR,
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
            ' ETH',
            p3,
            rounder(p4, true),
            ' ETH',
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
    return this.messageParser(this.props.config, this.props.children)
  }
}

const mapStateToProps = state => ({
  config: selectors.getConfig(state)
})

export default connect(mapStateToProps)(FilteredMessage)
