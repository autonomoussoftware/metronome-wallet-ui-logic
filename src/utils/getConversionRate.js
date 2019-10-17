import BigNumber from 'bignumber.js'

const format = {
  decimalSeparator: '.',
  groupSeparator: ',',
  groupSize: 3
}

BigNumber.config({ FORMAT: format })

/**
 * Returns the coin/MET rate of a conversion
 * Useful for displaying the obtained rate after a conversion estimate
 *
 * @param {Object} client - The client object
 * @param {string} metAmount - The MET amount provided or obtained (in wei)
 * @param {string} coinAmount - The coin amount provided or obtained (in wei)
 *
 * @returns {string} The conversion rate
 */
export function getConversionRate(client, metAmount, coinAmount) {
  const compareAgainst = client.fromWei(metAmount)
  return new BigNumber(coinAmount)
    .dividedBy(new BigNumber(compareAgainst))
    .integerValue()
    .toString(10)
}
