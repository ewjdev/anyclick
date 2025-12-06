const path = require("path");

// Load environment variables from root .env.local
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env.local"),
});

module.exports = {
  images: {
    remotePatterns: [new URL("https://s.yimg.com/**")],
  },
  transpilePackages: [
    "@ewjdev/anyclick-devtools",
    "@ewjdev/anyclick-core",
    "@ewjdev/anyclick-adapters",
    "@ewjdev/anyclick-react",
    "@ewjdev/anyclick-cursor",
    "@ewjdev/anyclick-cursor-local",
    "@ewjdev/anyclick-github",
    "@ewjdev/anyclick-jira",
  ],
};
