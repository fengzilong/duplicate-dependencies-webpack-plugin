const path = require( 'path' )
const { DuplicateReporterPlugin } = require( '../' )
const { getCompiler, run } = require( './helpers' )

describe( 'basic', () => {
  test( 'snapshot', async () => {
    const compiler = getCompiler( path.join( __dirname, 'fixtures/entry.js' ) )
    new DuplicateReporterPlugin().apply( compiler )
    await run( compiler )
  } )
} )
