
/* istanbul ignore next */
module.exports = {
  init: function(config, document) {
    this.config = config;
    return this.document = document;
  },
  createCookie: function(name, value, expires) {
    var date;
    this.eraseCookie(name);
    date = new Date();
    date.setTime(date.getTime() + (expires || 1200) * 1000);
    expires = "; expires=" + date.toGMTString();
    this.document.cookie = name + "=" + value + expires + "; path=/";
  },
  readCookie: function(name) {
    var c, ca, i, nameEQ;
    nameEQ = name + "=";
    ca = this.document.cookie.split(";");
    i = 0;
    while (i < ca.length) {
      c = ca[i];
      while (c.charAt(0) === " ") {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
      i++;
    }
    return null;
  },
  eraseCookie: function(name) {
    var date;
    date = new Date();
    date.setTime(date.getTime() - 86400000);
    this.document.cookie = name + "=; expires=" + date.toGMTString() + "; path=/";
  }
};
