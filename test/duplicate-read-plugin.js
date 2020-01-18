const DuplicatePlugin = require( '../' )

const ID = 'duplicate-read-plugin'

class DuplicateReadPlugin {
  constructor( options = {} ) {
    this._options = options
  }

  apply( compiler ) {
    const options = this._options

    compiler.hooks.compilation.tap( ID, compilation => {
      DuplicatePlugin.getHooks( compilation ).result
        .tap( ID, duplicates => {
          if ( options.callback ) {
            options.callback( duplicates )
          }
        } )
    } )
  }
}

module.exports = DuplicateReadPlugin
