const webpack = require( 'webpack' )

function getCompiler( entry ) {
  const compiler = webpack( {
    entry,
    mode: 'development',
  } )
  
  const mfs = new webpack.MemoryOutputFileSystem()

  compiler.outputFileSystem = mfs
  
  return compiler
}

function run( compiler ) {
  return new Promise( ( resolve, reject ) => {
    compiler.run( ( error, stats ) => {
      if ( error ) {
        return reject( error )
      }

      return resolve( stats )
    } )
  } )
}

exports.getCompiler = getCompiler
exports.run = run
