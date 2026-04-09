const express = require("express");
const path = require("path");
const signalRouter = require("./routes/signal");
const demoRouter = require("./routes/demo");

const app = express();

app.use(express.json());
app.use((request, response, next) => {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Expires", "0");
  next();
});
app.use(express.static(path.join(__dirname, "..", "public"), {
  etag: false,
  lastModified: false
}));

app.use("/signal", signalRouter);
app.use("/demo", demoRouter);

app.get("/health", (_request, response) => {
  response.json({
    message: "Autonomous trading agent signal server is running.",
    endpoints: {
      frontend: "/",
      signal: "/signal",
      demo: "/demo/run-agent"
    }
  });
});

app.use((error, _request, response, _next) => {
  response.status(500).json({
    message: error.message || "Unexpected server error."
  });
});

module.exports = app;
