# metronome-wallet-ui-logic

This package contains common elements required to develop the UI of an Ethereum Metronome wallet with React and Redux on different platforms.

The intent behind all this is that for each platform we only have to build:

1. a `client` implementing platform-specific functionality (such as storage), and
2. the view rendering code.

Everything else should be abstracted in this package and [metronome-wallet-core](https://github.com/autonomoussoftware/metronome-wallet-core), which takes care of core wallet logic.

Supported target environments are Electron, React Native and web.

## Contents

These are the common elements intended to be directly imported by different platform implementations:

### `src/components`

React components that can be reused across different platforms because they don't rely on platform-specific elements.

These include:

- `<Root />`
- `<TermsAndConditions />`

Check [src/components](https://github.com/autonomoussoftware/metronome-wallet-ui-logic/tree/master/src/components)

_Example usage:_

```js
import React from 'react'
import Root from 'metronome-wallet-ui-logic/components/Root'

import Onboarding from './components/Onboarding'
import Loading from './components/Loading'
import Router from './components/Router'
import Login from './components/Login'

...

class MyComponent extends React.Component {
  ...

  render() {
    return (
      <Root
        OnboardingComponent={Onboarding}
        LoadingComponent={Loading}
        RouterComponent={Router}
        LoginComponent={Login}
      />
    )
  }
}
```

### `src/hocs`

Functions that follow the [Higher-Order Component](https://reactjs.org/docs/higher-order-components.html) pattern. These functions encapsulate all the common UI logic and Redux store mappings and inject useful props to the composed components.

Check [src/hocs](https://github.com/autonomoussoftware/metronome-wallet-ui-logic/tree/master/src/hocs)

_Example usage:_

```js
import withAuctionState from 'metronome-wallet-ui-logic/hocs/withAuctionState'
import React from 'react'

const Auction = props => {

  // These props are injected by withAuctionState() higher-order component
  const {
    countdownTargetTimestamp,
    buyDisabledReason,
    auctionPriceUSD,
    auctionStatus,
    buyDisabled,
    navigation,
    title
  } = props

  return (
    // Platform-specific code here...
  )
}

export default withAuctionState(Auction)
```

### `src/store`

This module exports a `createStore(reduxDevtoolsOptions, initialState)` function and a Redux `<Provider />` component.

Check [src/store/index.js](https://github.com/autonomoussoftware/metronome-wallet-ui-logic/tree/master/src/store/index.js)

_Example usage:_

```js
import { Provider as ClientProvider } from 'metronome-wallet-ui-logic/hocs/clientContext'
import { createStore, Provider } from 'metronome-wallet-ui-logic/store'
import React from 'react'

import createClient from './client'
import config from './config'

const client = createClient(config, createStore)

class App extends React.Component {
  render() {
    return (
      <ClientProvider value={client}>
        <Provider store={client.store}>
          {/* App's Root component goes here... */}
        </Provider>
      </ClientProvider>
    )
  }
}
```

### `src/utils`

Miscelaneous helper functions.

Check [src/utils/index.js](https://github.com/autonomoussoftware/metronome-wallet-ui-logic/tree/master/src/utils/index.js)

### `src/theme`

This is an object containing theme constants such as colors and font sizes to be used for component styles.

Check [src/theme/index.js](https://github.com/autonomoussoftware/metronome-wallet-ui-logic/tree/master/src/theme/index.js)

### Other (not intended to be directly imported)

#### `src/validators`

Form data validators used by `hocs`.

#### `src/selectors`

[`reselect`](https://github.com/reduxjs/reselect) memoized store selectors. Used by `hocs`.

#### `src/reducers`

Redux reducers, used by `store`.

## License

MIT
