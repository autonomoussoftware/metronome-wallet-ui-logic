import { useState, useEffect } from 'react'
import { every, overEvery } from 'lodash'

/**
 * @param {Object} chains - A map of enabled chains
 * @param {number} showDetailsDelay - The amount of ms to wait before displaying a "See details" button
 
 * @returns {Object} result
 * @returns {Function} result.handleDetailsClick - "See Details" click handler
 * @returns {Object} result.isDetailVisible - True if details should be visible
 * @returns {Object} result.isBtnVisible - True if "See Details" should be visible
 */
export default function useLoadingState(chains, showDetailsDelay = 5000) {
  const [isDetailVisible, setDetailVisibility] = useState(false)
  const [isBtnVisible, setBtnVisibility] = useState(false)

  const isComplete = every(
    chains,
    overEvery([
      'hasBlockHeight',
      'hasCoinBalance',
      'hasMetBalance',
      'hasCoinRate'
    ])
  )

  useEffect(() => {
    const timerId = setTimeout(
      () => !isComplete && setBtnVisibility(true),
      showDetailsDelay
    )
    return () => timerId && clearTimeout(timerId)
  }, [isComplete, showDetailsDelay])

  return {
    handleDetailsClick: () => {
      setDetailVisibility(true)
      setBtnVisibility(false)
    },
    isDetailVisible,
    isBtnVisible
  }
}
