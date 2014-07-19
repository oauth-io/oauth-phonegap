var OAuth_creator;

OAuth_creator = require('./lib/oauth')(window, document, window.jQuery || window.Zepto, navigator);

OAuth_creator(window || this);
