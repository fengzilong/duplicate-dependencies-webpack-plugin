# duplicate-dependencies-webpack-plugin

![npm version](https://img.shields.io/npm/v/duplicate-dependencies-webpack-plugin)
![npm downloads](https://img.shields.io/npm/dm/duplicate-dependencies-webpack-plugin)
![actions status](https://github.com/fengzilong/duplicate-dependencies-webpack-plugin/workflows/Node%20CI/badge.svg)

A webpack plugin for finding all duplicated dependencies in your bundle

## Installation

For yarn users

```bash
yarn add duplicate-dependencies-webpack-plugin --dev
```

For npm users

```bash
npm i duplicate-dependencies-webpack-plugin -D
```

## Usage

This plugin is designed to be more flexible

So you need to use it together with a reporter plugin

Internally this plugin expose a hook called `result`

`webpack.config.js`

```js
const DuplicatePlugin = require( 'duplicate-dependencies-webpack-plugin' )

class DuplicatesReporterPlugin {
  apply( compiler ) {
    compiler.hooks.compilation.tap( ID, compilation => {
      DuplicatePlugin.getHooks( compilation ).result
        .tap( ID, duplicates => {
          // here you get the `duplicates` data
          // do whatever you want with this
          useCustomPrettyReporter( duplicates )
        } )
    } )
  }
}

module.exports = {
  plugins: {
    new DuplicatePlugin(),
    new DuplicatesReporterPlugin()
  }
}
```

## License

MIT
