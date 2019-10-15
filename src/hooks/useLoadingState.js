import { useState, useEffect } from 'react'
import { every, overEvery } from 'lodash'

// eslint-disable-next-line require-jsdoc
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
