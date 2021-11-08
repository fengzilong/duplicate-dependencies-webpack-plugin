# duplicate-dependencies-webpack-plugin

![npm version](https://img.shields.io/npm/v/duplicate-dependencies-webpack-plugin)
![npm downloads](https://img.shields.io/npm/dm/duplicate-dependencies-webpack-plugin)
![actions status](https://github.com/fengzilong/duplicate-dependencies-webpack-plugin/workflows/Node%20CI/badge.svg)

A webpack plugin to find all duplicated dependencies in your bundle

<img src="media/screenshot.jpg" alt="screenshot" width="500px">

## Installation

For yarn users

```bash
yarn add duplicate-dependencies-webpack-plugin --dev
```

For npm users

```bash
npm i duplicate-dependencies-webpack-plugin -D
```

## Basic Usage

`webpack.config.js`

```js
const { DuplicateReporterPlugin } = require( 'duplicate-dependencies-webpack-plugin' )

module.exports = {
  plugins: {
    new DuplicateReporterPlugin()
  }
}
```

## Advanced Usage

This plugin is designed to be more flexible

So you may want to use it together with a reporter plugin

Internally this plugin expose a hook called `result`

`webpack.config.js`

```js
const DuplicatePlugin = require( 'duplicate-dependencies-webpack-plugin' )

const ID = 'duplicates-reporter'
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

duplicates looks like:

```js
{
  'package_name': [
    {
      name: 'package_name',
      version: '4.2.2',
      root: 'absolute_path_to_package_root',
      issuer: 'absolute_path_to_issuer', // the file issue the request
      files: [Array], // files in this package which are included in your bundle
      bytes: 4000 // bytes contributed by this packages
    },
    // ...more versions
  ]
}
```

## License

MIT
