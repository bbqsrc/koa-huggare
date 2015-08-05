# koa-huggare

A clone of `koa-logger` that uses [huggare](https://github.com/bbqsrc/huggare) for logging.

## Usage

```javascript
var app = require('koa')(),
    logger = require('koa-huggare');

app.use(logger({
  exclude: /^\/static/ // Exclude based on tag param (optional)
}));
```

## License

MIT (same as koa-logger)
