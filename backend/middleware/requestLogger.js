const morgan = require("morgan");

// Format: METHOD /path STATUS response-time ms
module.exports = morgan(":method :url :status :response-time ms — :res[content-length] bytes");
