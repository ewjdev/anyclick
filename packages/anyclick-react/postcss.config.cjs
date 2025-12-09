// tailwindcss@4 is ESM-only; use .default when requiring from CJS.
const tailwindcss = require("tailwindcss").default;
const autoprefixer = require("autoprefixer").default ?? require("autoprefixer");

module.exports = {
  plugins: [tailwindcss, autoprefixer],
};
