/* eslint-disable no-magic-numbers */
const path = require( 'path' )
const isPathInside = require( 'is-path-inside' )
const { SyncHook } = require( 'tapable' )

const ID = 'duplicate-dependencies-webpack-plugin'
const hooksMap = new WeakMap()
const cwd = process.cwd()
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

    compiler.hooks.thisCompilation.tap( ID, compilation => {
      compilation.hooks.succeedModule.tap( ID, module => {
        const meta = getModulePackageMetaData( module )

        // not a package
        if ( !meta ) {
          return
        }

        const {
          name,
          root,
          issuerPath,
        } = meta

        packages[ name ] = packages[ name ] || []

        // if same root exists, skip
        if ( packages[ name ].some( version => version.root === root ) ) {
          return
        }

        packages[ name ].push( {
          root,
          name,
          version: null,
          issuer: issuerPath[ 0 ],
          issuerPath,
          files: [],
          bytes: 0
        } )
      } )
    } )

    compiler.hooks.afterCompile.tap( ID, compilation => {
      // afterCompile may trigger several times
      // e.g. compilation created by createChildCompiler
      // from html-webpack-plugin or mini-css-extract-plugin
      // only allow main compiler
      if ( compilation.compiler !== compiler ) {
        return
      }

      const hooks = DuplicateDependenciesWebpackPlugin.getHooks( compilation )

      const flattenDuplicates = Object.keys( packages )
        .filter( name => packages[ name ].length > 1 )
        .reduce( ( memo, name ) => {
          [].push.apply( memo, packages[ name ] )
          return memo
        }, [] )

      getModules( compilation ).forEach( m => {
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

      const fs = compiler.inputFileSystem.fileSystem

      const duplicates = Object.keys( packages )
        .reduce( ( memo, name ) => {
          let versions = packages[ name ] || []

          // remove versions with zero bytes
          versions = versions.filter( version => version.bytes > 0 )

          if ( versions.length > 1 ) {
            versions.forEach( version => {
              if ( version.root ) {
                try {
                  const pkgString = fs.readFileSync(
                    path.join( version.root, 'package.json' ),
                    'utf8'
                  )
                  const pkg = JSON.parse( pkgString )

                  version.version = pkg.version
                } catch ( e ) {}
              }
            } )
            memo[ name ] = versions
          }

          return memo
        }, {} )

      hooks.result.call( duplicates )
    } )
  }
}

function getModules( compilation = {} ) {
  if ( compilation._modules && compilation._modules.values ) {
    return [ ...compilation._modules.values() ]
  }

  return compilation.modules || []
}

function isInNodeModules( filepath = '' ) {
  return filepath.includes( 'node_modules' )
}

function normalizePath( filepath = '' ) {
  return filepath.replace( /\\/g, '/' )
}

function isScoped( string = '' ) {
  return string.startsWith( '@' ) || string.startsWith( '_@' )
}

function getPackageName( relativePath = '' ) {
  const parts = relativePath.split( '/' )
  const lastNodeModulesIndex = parts.lastIndexOf( 'node_modules' )

  if ( lastNodeModulesIndex === -1 ) {
    return
  }

  let index = lastNodeModulesIndex + 1

  if ( isScoped( parts[ index ] ) ) {
    index = index + 1
  }

  let name = parts
    .slice( lastNodeModulesIndex + 1, index + 1 )
    .join( '/' )

  const lastAtIndex = name.lastIndexOf( '@' )

  name = name.substring( lastAtIndex + 1 )

  if ( name.includes( '/' ) ) {
    name = `@${ name }`
  }

  return name
}

function getPackageRoot( relativePath = '' ) {
  const parts = relativePath.split( '/' )
  const lastNodeModulesIndex = parts.lastIndexOf( 'node_modules' )

  if ( lastNodeModulesIndex === -1 ) {
    return
  }

  let index = lastNodeModulesIndex + 1

  if ( isScoped( parts[ index ] ) ) {
    index = index + 1
  }

  return parts.slice( 0, index + 1 ).join( '/' )
}

function getPackageIssuerPath( issuer, packageName ) {
  let currentModule = issuer
  let issuerPath = []

  let times = 0
  while ( currentModule ) {
    if ( !currentModule.resource ) {
      break
    }

    const relativePath = normalizePath( path.relative( cwd, currentModule.resource ) )
    const issuerName = getPackageName( relativePath )
    if ( !issuerName || ( issuerName !== packageName ) ) {
      issuerPath.push( relativePath )
    }

    currentModule = currentModule.issuer

    times++

    if ( times > 10 ) {
      break
    }
  }

  return issuerPath
}

function getModulePackageMetaData( module ) {
  if ( !module.resource ) {
    return
  }

  const relativePath = normalizePath( path.relative( cwd, module.resource ) )

  // not a package
  if ( !isInNodeModules( relativePath ) ) {
    return
  }

  const name = getPackageName( relativePath )
  const root = getPackageRoot( relativePath )
  const issuerPath = getPackageIssuerPath( module.issuer, name )

  return {
    name,
    root,
    issuerPath
  }
}

module.exports = DuplicateDependenciesWebpackPlugin
