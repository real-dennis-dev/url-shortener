// src/modules/urls/index.js
const urlRoutes = require("./routes/url.routes");
const urlService = require("./services/url.service");
const urlController = require("./controllers/url.controller");
const urlMiddleware = require("./middleware/url.middleware");
const urlUtils = require("./utils/url.utils");
const urlSchemas = require("./validations/url.validation");

module.exports = {
  routes: urlRoutes,
  service: urlService,
  controller: urlController,
  middleware: urlMiddleware,
  utils: urlUtils,
  schemas: urlSchemas,
};
