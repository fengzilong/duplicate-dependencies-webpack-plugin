const path = require( 'path' )
const boxen = require( 'boxen' )
const table = require( 'text-table' )
const chalk = require( 'chalk' )
const stringWidth = require( 'string-width' )
const prettyBytes = require( 'pretty-bytes' )
const DuplicatePlugin = require( './plugin' )

const ID = 'duplicate-reporter-plugin'

class DuplicateReporter {
  apply( compiler ) {
    new DuplicatePlugin().apply( compiler )

    compiler.hooks.compilation.tap( ID, compilation => {
      DuplicatePlugin.getHooks( compilation ).result
        .tap( ID, ( duplicates = {} ) => {
          if ( Object.keys( duplicates ).length === 0 ) {
            return
          }

          const header = [
            'Name',
            'Version',
            'Bytes',
            'Issuer',
          ]

          const divider = [
            '---',
            '---',
            '---',
            '---',
          ].map( v => chalk.dim( v ) )

          const empty = [ '', '', '', '' ]

          const data = []
          const cwd = process.cwd()

          const len = Object.keys( duplicates ).length
          const names = Object.keys( duplicates )

          names.sort( ( a, b ) => {
            return getTotalBytes( duplicates[ b ] ) -
              getTotalBytes( duplicates[ a ] )
          } )

          names.forEach( ( name, index ) => {
              const versions = duplicates[ name ] || []
              versions.forEach( version => {
                data.push( [
                  chalk.blue( version.name ),
                  chalk.green( version.version ),
                  prettyBytes( version.bytes ),
                  chalk.dim( path.relative( cwd, version.issuer ) ),
                ] )
              } )
              if ( index !== len - 1 ) {
                data.push( empty )
              }
            } )

          const rows = [
            header,
            divider,
            ...data,
          ]

          const title = `${
            chalk.magenta.bold( 'Duplicate Dependencies Report' )
          } ${ chalk.dim.italic( '( Ordered by byte size )' ) }`

          const output = boxen(
            `${ title }\n\n` +
            table( rows, {
              stringLength: stringWidth,
            } ),
            {
              borderColor: 'gray',
              dimBorder: true,
              borderStyle: 'classic',
              padding: 1,
            }
          )

          console.log( `\n${ output }\n` )
        } )
    } )
  }
}

function getTotalBytes( versions = [] ) {
  return versions.reduce( ( memo, version ) => {
    if ( !version ) {
      return memo
    }

    return memo + ( version.bytes || 0 )
  }, 0 )
}

module.exports = DuplicateReporter
