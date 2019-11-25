import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import moment from 'moment'
import React from 'react'

import * as selectors from '../selectors'

class TimeAgo extends React.Component {
  static propTypes = {
    updateInterval: PropTypes.number,
    blockTime: PropTypes.number.isRequired,
    timestamp: PropTypes.number.isRequired,
    render: PropTypes.func
  }

  static defaultProps = {
    updateInterval: 60 * 1000 // ms before forcing a "time ago" calculation
  }

  timer = null

  recalculateTimeAgo = () => this.forceUpdate()

  componentDidMount() {
    // optimize "time ago" display for smaller intervals
    moment.relativeTimeThreshold('s', 60)
    moment.relativeTimeThreshold('ss', 4)

    this.timer = setInterval(this.recalculateTimeAgo, this.props.updateInterval)
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer)
  }

  render() {
    if (typeof this.props.timestamp !== 'number') return null
    const timeAgo = moment.unix(this.props.timestamp).fromNow()
    const diff = parseInt(Date.now() / 1000, 10) - this.props.timestamp
    const level =
      diff > this.props.blockTime * 4
        ? 'danger'
        : diff > this.props.blockTime
        ? 'warning'
        : 'ok'

    return typeof this.props.render === 'function'
      ? this.props.render({ timeAgo, level })
      : timeAgo
  }
}

const mapStateToProps = state => ({
  blockTime: selectors.getBlockTime(state)
})

export default connect(mapStateToProps)(TimeAgo)
