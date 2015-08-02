"use strict";

/* Port of koajs/logger to use huggare. MIT licensed. */

var Counter = require('passthrough-counter');
var humanize = require('humanize-number');
var bytes = require('bytes');

var Log = require('huggare');

module.exports = function(opts) {
  opts = opts || {};

  var tag = opts.tag || "koa";
  var tagReq = tag + '/req';
  var tagRes = tag + '/res';

  return function *logger(next) {
    // request
    var start = new Date;
    Log.i(tagReq, this.method + " " + this.originalUrl + " " + this.ip);

    try {
      yield next;
    } catch (err) {
      // log uncaught downstream errors
      log(tagRes, this, start, null, err);
      throw err;
    }

    // calculate the length of a streaming response
    // by intercepting the stream with a counter.
    // only necessary if a content-length header is currently not set.
    var length = this.response.length;
    var body = this.body;
    var counter;
    if (null == length && body && body.readable) {
      this.body = body
        .pipe(counter = Counter())
        .on('error', this.onerror);
    }

    // log when the response is finished or closed,
    // whichever happens first.
    var ctx = this;
    var res = this.res;

    var onfinish = done.bind(null, 'finish');
    var onclose = done.bind(null, 'close');

    res.once('finish', onfinish);
    res.once('close', onclose);

    function done(event){
      res.removeListener('finish', onfinish);
      res.removeListener('close', onclose);
      log(tagRes, ctx, start, counter ? counter.length : length, null, event);
    }
  };
}

function log(tag, ctx, start, len, err, event) {
  // get the status code of the response
  var status = err
    ? (err.status || 500)
    : (ctx.status || 404);

  // get the human readable response length
  var length;
  if (~[204, 205, 304].indexOf(status)) {
    length = '';
  } else if (null == len) {
    length = '-';
  } else {
    length = bytes(len);
  }

  var logFunc = err ? Log.e
    : event === 'close' ? Log.w
    : Log.i

  var msg = ctx.method + " " +
            ctx.originalUrl + " " +
            status + " " +
            time(start) + " " +
            length + " " +
            this.ip;
  logFunc.call(this, tag, msg);
}

function time(start) {
  var delta = new Date - start;
  delta = delta < 10000
    ? delta + 'ms'
    : Math.round(delta / 1000) + 's';
  return humanize(delta);
}