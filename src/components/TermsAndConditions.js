import PropTypes from 'prop-types'
import React from 'react'

const TermsAndConditions = ({ ParagraphComponent: P }) => (
  <React.Fragment>
    <P>Copyright 2018-{new Date().getFullYear().toString()} Autonomous Software</P>
    <P>
      Permission is hereby granted, free of charge, to any person obtaining a
      copy of this software and associated documentation files (the
      &ldquo;Software&rdquo;), to deal in the Software without restriction,
      including without limitation the rights to use, copy, modify, merge,
      publish, distribute, sublicense, and/or sell copies of the Software, and
      to permit persons to whom the Software is furnished to do so, subject to
      the following conditions:
    </P>
    <P>
      The above copyright notice and this permission notice shall be included in
      all copies or substantial portions of the Software.
    </P>
    <P>
      THE SOFTWARE IS PROVIDED &ldquo;AS IS&rdquo;, WITHOUT WARRANTY OF ANY
      KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      USE OR OTHER DEALINGS IN THE SOFTWARE.
    </P>
    <P>ADDITIONAL TERMS REGARDING SOFTWARE USE</P>
    <P>
      The Software represents cryptocurrency wallet software (the
      &ldquo;Wallet&rdquo;). IF YOU LOSE ACCESS TO YOUR WALLET OR YOUR ENCRYPTED
      PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET
      AND CORRESPONDING PASSWORD, ANY AMOUNTS YOU HAVE STORED WITHIN WALLET WILL
      BECOME INACCESSIBLE. Autonomous Software cannot retrieve your private keys
      or passwords if you lose or forget them. Autonomous Software does not
      control any of the protocols that govern any cryptocurrency and cannot
      confirm any transaction
    </P>
    <P>
      Transactions with cryptocurrencies carry inherent risks. Cryptocurrency
      values may involve risk of capital loss from unfavorable fluctuation in
      cryptocurrency values, technical defects inherent in cryptocurrencies,
      exchange-related risks, policy risks, regulatory risks, liquidity, and
      market price fluctuation and demand. The value of any cryptocurrency is
      not ensured. The worth of any amount of cryptocurrency and may lose all
      worth at any moment of time due to the risky nature of cryptocurrencies.
      Virtual currency is not legal tender, is not backed by the government, and
      accounts and value balances are not subject to FDIC or SIPC protections,
      among others. You are solely responsible for any such losses and the
      management of the cryptocurrencies in your Wallet. There may be an
      increased risk of loss of cryptocurrency due to cyber-attacks. Autonomous
      Software shall not be liable for any losses to your Wallet you may suffer
      as a result of a security breach, fraudulent activity or hacking event.
    </P>
  </React.Fragment>
)

TermsAndConditions.propTypes = {
  ParagraphComponent: PropTypes.func.isRequired
}

export default TermsAndConditions
