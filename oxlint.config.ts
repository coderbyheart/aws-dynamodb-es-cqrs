import config from "@coderbyheart/oxlint-config";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [config],
  // oxfmt formats type members with semicolons, which conflicts with this rule
  rules: {
    "@stylistic/member-delimiter-style": "off",
  },
  options: {
    typeAware: true,
  },
});
