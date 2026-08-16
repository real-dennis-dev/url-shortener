// src/modules/moderation/index.js
const routes = require("./routes");
const ModerationService = require("./service");
const moderationUtils = require("./utils");
const moderationMiddleware = require("./middleware");

module.exports = {
  routes,
  ModerationService,
  moderationUtils,
  moderationMiddleware,
};
