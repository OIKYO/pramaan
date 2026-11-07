import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const motionOnlyInUi = {
  paths: ["motion", "motion/react", "framer-motion"].map((name) => ({
    name,
    message: "Animations live only in src/lib/motion.ts and src/components/ui. Use a ui component instead.",
  })),
};

const classString = "JSXAttribute[name.name='className']";

export default defineConfig([
  globalIgnores(["dist", "src/api/schema.d.ts"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
  },
  {
    // Motion is allowed only where animations are defined.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/motion.ts", "src/components/ui/**"],
    rules: { "no-restricted-imports": ["error", motionOnlyInUi] },
  },
  {
    // Pages do layout only: no inline styles, no animation classes, no raw colours.
    files: ["src/pages/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "JSXAttribute[name.name='style']", message: "No style= in pages. Put the styling in a component." },
        {
          selector: `${classString} Literal[value=/(^|\\s)(animate-|transition)/]`,
          message: "No animation or transition classes in pages. Motion belongs in components/ui.",
        },
        {
          selector: `${classString} TemplateElement[value.raw=/(^|\\s)(animate-|transition)/]`,
          message: "No animation or transition classes in pages. Motion belongs in components/ui.",
        },
        {
          selector: `${classString} Literal[value=/#[0-9a-fA-F]{3,8}/]`,
          message: "No hex colours in pages. Use the colour tokens.",
        },
        {
          selector: `${classString} TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}/]`,
          message: "No hex colours in pages. Use the colour tokens.",
        },
      ],
    },
  },
]);
