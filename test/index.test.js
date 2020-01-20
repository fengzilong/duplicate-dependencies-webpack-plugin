const path = require( 'path' )
const Plugin = require( '../' )
const DuplicateReadPlugin = require( './duplicate-read-plugin' )
const { getCompiler, run } = require( './helpers' )

describe( 'basic', () => {
  test( 'snapshot', async done => {
    const compiler = getCompiler( path.join( __dirname, 'fixtures/entry.js' ) )
    
    new Plugin().apply( compiler )
    new DuplicateReadPlugin( {
      callback( duplicates ) {
        formatDuplicates( duplicates )
        expect( duplicates ).toMatchSnapshot()
        done()
      }
    } ).apply( compiler )
    
    await run( compiler )
  } )
} )

function formatDuplicates( duplicates = {} ) {
  const cwd = process.cwd()

  Object.keys( duplicates )
    .forEach( name => {
      const versions = duplicates[ name ] || []
      versions.forEach( version => {
        version.issuer = path.relative( cwd, version.issuer )
        version.root = path.relative( cwd, version.root )
        version.files = version.files.map( file => {
          return path.relative( cwd, file )
        } )
      } )
    } )
}
