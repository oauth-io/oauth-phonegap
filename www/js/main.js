var OAuth_creator, jquery;

if (typeof jQuery !== "undefined" && jQuery !== null) {
  jquery = jQuery;
} else {
  jquery = void 0;
}

OAuth_creator = require('./lib/oauth')(window, document, jquery, navigator);

OAuth_creator(window || this);
