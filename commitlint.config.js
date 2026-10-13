export default {
  extends: ["@commitlint/config-conventional"],
  ignores: [(message) => message.startsWith("Merge ")],
  rules: {
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
