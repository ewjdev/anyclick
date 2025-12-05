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
  ],
};
