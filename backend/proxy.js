// Simple tunneling proxy - run this to expose backend
import express from "express";
import { createProxyMiddleware } from "express-http-proxy";

const app = express();
const PORT = 3000;

// Proxy all requests to your local backend
app.use(
  "/",
  createProxyMiddleware({
    target: "http://localhost:5000",
    changeOrigin: true,
    pathRewrite: {
      "^/": "/",
    },
  })
);

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log("Forwarding requests to http://localhost:5000");
});
