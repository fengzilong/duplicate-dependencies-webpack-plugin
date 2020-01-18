const isPathInside = require( 'is-path-inside' )
const { SyncHook } = require( 'tapable' )

const ID = 'duplicate-dependencies-webpack-plugin'

const hooksMap = new WeakMap()

class DuplicateDependenciesWebpackPlugin {
  static getHooks( compilation ) {
    let hooks = hooksMap.get( compilation )

    if ( typeof hooks === 'undefined' ) {
      hooks = {
        result: new SyncHook( [ 'duplicates' ] )
      }

      hooksMap.set( compilation, hooks )
    }
    
    return hooks
  }
  
  apply( compiler ) {
    const packages = {}

    compiler.resolverFactory.hooks.resolver.for( 'normal' ).tap( ID, resolver => {
      resolver.hooks.result.tapAsync( ID, ( request = {}, context, callback ) => {
        if ( request.descriptionFileData ) {
          const { context = {}, path, descriptionFileRoot: root } = request
          const { issuer } = context
          const { name, version } = request.descriptionFileData || {}

          packages[ name ] = packages[ name ] || []
          // only record the first issuer
          if ( !packages[ name ].some( d => d.root === root && d.version === version ) ) {
            packages[ name ].push( {
              root,
              name,
              version,
              issuer,
              files: [],
              bytes: 0
            } )
          }
        }

        callback()
      } )
    } )

    compiler.hooks.afterCompile.tap( ID, compilation => {
      // afterCompile may trigger several times
      // e.g. compilation created by createChildCompiler
      // from html-webpack-plugin or mini-css-extract-plugin
      if ( compilation.name ) {
        return
      }

      const hooks = DuplicateDependenciesWebpackPlugin.getHooks( compilation )

      const flattenDuplicates = Object.keys( packages )
        .filter( name => packages[ name ].length > 1 )
        .reduce( ( memo, name ) => {
          ;[].push.apply( memo, packages[ name ] )
          return memo
        }, [] )

      compilation.modules.forEach( m => {
        flattenDuplicates.forEach( duplicate => {
          // like *.vue?vue&type=template
          if ( !m.resource ) {
            return
          }

          if ( isPathInside( m.resource, duplicate.root ) ) {
            duplicate.files.push( m.resource )
            duplicate.bytes = duplicate.bytes + m.size()
          }
        } )
      } )

      const duplicates = Object.keys( packages )
        .filter( name => {
          let versions = packages[ name ] || []

          if ( versions.length <= 1 ) {
            return false
          }

          // also remove versions with zero bytes
          versions = versions.filter( version => version.bytes > 0 )

          return versions.length > 1
        } )
        .reduce( ( memo, name ) => {
          memo[ name ] = packages[ name ]
          return memo
        }, {} )

      hooks.result.call( duplicates )
    } )
  }
}

module.exports = DuplicateDependenciesWebpackPlugin
