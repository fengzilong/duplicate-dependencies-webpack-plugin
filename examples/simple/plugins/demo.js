const DuplicatePlugin = require( '../../../' )

const ID = 'demo-plugin'

class DemoPlugin {
  apply( compiler ) {
    compiler.hooks.compilation.tap( ID, compilation => {
      DuplicatePlugin.getHooks( compilation ).result.tap( ID, duplicates => {
        // sort by package size in plugin
        console.log( 'duplicates', duplicates )
      } )
    } )
  }
}

module.exports = DemoPlugin
