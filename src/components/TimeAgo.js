import PropTypes from 'prop-types'
import moment from 'moment'
import React from 'react'

export default class TimeAgo extends React.Component {
  static propTypes = {
    updateInterval: PropTypes.number,
    timestamp: PropTypes.number.isRequired
  }

  static defaultProps = {
    updateInterval: 60 * 1000 // ms before forcing a "time ago" calculation
  }

  timer = null

  recalculateTimeAgo = () => this.forceUpdate()

  componentDidMount() {
    this.timer = setInterval(this.recalculateTimeAgo, this.props.updateInterval)
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer)
  }

  render() {
    return typeof this.props.timestamp === 'number'
      ? moment.unix(this.props.timestamp).fromNow()
      : null
  }
}
