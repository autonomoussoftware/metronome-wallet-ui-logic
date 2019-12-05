/**
 * A timer similar to setTimeout() but with stop() and resume() methods
 *
 * @param {Function} callback - A function to be called when the timer finishes
 * @param {number} delay - The timer delay in milliseconds
 */
export default function Timer(callback, delay) {
  let start
  let remaining = delay

  this.timerId = null

  this.pause = function() {
    clearTimeout(this.timerId)
    remaining -= new Date() - start
  }

  this.resume = function() {
    start = new Date()
    if (this.timerId) clearTimeout(this.timerId)
    this.timerId = setTimeout(callback, remaining)
  }

  this.stop = function() {
    if (this.timerId) clearTimeout(this.timerId)
    this.timerId = null
  }

  this.resume()
}
