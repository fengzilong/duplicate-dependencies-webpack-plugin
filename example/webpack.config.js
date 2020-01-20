const { DuplicateReporterPlugin } = require( '../' )

module.exports = {
  mode: 'development',
  plugins: [
    new DuplicateReporterPlugin()
  ]
}
