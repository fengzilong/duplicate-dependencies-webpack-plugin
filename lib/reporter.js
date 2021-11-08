const path = require( 'path' )
const Table = require( 'cli-table3' )
const chalk = require( 'chalk' )
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
            'Issuer Chain ' + chalk.dim( '⇡' ),
          ]

          // const divider = [ '', '', '', '' ]

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
                chalk.blue( version.name || '' ),
                chalk.green( version.version || 'unknown' ),
                prettyBytes( version.bytes || 'unknown' ),
                version.issuerPath.map( issuer => {
                  return issuer ? chalk.dim( path.relative( cwd, issuer ) ) : 'unknown'
                } ).join( '\n' ),
              ] )
            } )
            if ( index !== len - 1 ) {
              // data.push( divider )
            }
          } )

          const title = `${
            chalk.magenta.bold( 'Duplicate Dependencies Report' )
          } ${ chalk.dim.italic( '( Ordered by byte size )' ) }`

          const table = new Table( {
            head: header,
            chars: {
              top: '',
              'top-mid': '',
              'top-left': '',
              'top-right': '',
              bottom: '',
              'bottom-mid': '',
              'bottom-left': '',
              'bottom-right': '',
              left: '',
              'left-mid': '',
              mid: '─',
              'mid-mid': '─',
              right: '',
              'right-mid': '',
              middle: ' ',
            },
            style: {
              head: [ '#fff' ]
            },
          } )

          const lines = data.map( columns => {
            return columns.map( column => {
              return {
                content: column,
                vAlign: 'center',
              }
            } )
          } )

          table.push( ...lines )

          const output = `\n ${ title }\n\n` + table.toString() + '\n'

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
