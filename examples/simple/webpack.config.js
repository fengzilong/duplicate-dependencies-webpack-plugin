const DuplicatePlugin = require( '../../' )
const DemoPlugin = require( './plugins/demo' )

module.exports = {
  mode: 'development',
  plugins: [
    new DuplicatePlugin(),
    new DemoPlugin()
  ]
};
