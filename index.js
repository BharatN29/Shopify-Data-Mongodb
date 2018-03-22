require('es6-promise').polyfill();
require('isomorphic-fetch');

const express = require("express");
const app = express();
const morgan = require("morgan");
const config = require("./config");
const shopify = require('./shopify');

app.use(morgan("dev"));
app.use(express.json());

app.use("/shopify/", shopify);

app.listen(config.APP_PORT, () => {
  console.log("Listening on port", config.APP_PORT);
});

