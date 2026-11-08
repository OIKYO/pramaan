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

const LAYOUT_CLASS =
  /^(?:(?:sm|md|lg|xl|2xl|max-sm|max-md|max-lg|max-xl|@[a-z0-9]+):)*(?:flex|inline-flex|grid|inline-grid|flex-(?:row|col|wrap|row-reverse|col-reverse|nowrap|1|auto|initial|none)|grid-cols-\S+|grid-rows-\S+|grid-flow-\S+|col-\S+|row-\S+|gap(?:-[xy])?-\S+|items-\S+|justify-\S+|content-\S+|self-\S+|justify-self-\S+|place-\S+|order-\S+)$/;

const layoutOnly = {
  meta: {
    type: "problem",
    messages: {
      notLayout:
        "Pages do layout only (flex, grid, gap). Move “{{name}}” into a component in components/ui or a feature folder.",
    },
  },
  create(context) {
    const check = (node, text) => {
      for (const name of text.split(/\s+/).filter(Boolean)) {
        if (!LAYOUT_CLASS.test(name)) context.report({ node, messageId: "notLayout", data: { name } });
      }
    };
    return {
      "JSXAttribute[name.name='className'] Literal"(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      "JSXAttribute[name.name='className'] TemplateElement"(node) {
        check(node, node.value.raw);
      },
    };
  },
};

const noMonospace = {
  meta: { type: "problem", messages: { mono: "Pramaan uses one typeface. Drop “{{name}}”; use tabular-nums for numbers." } },
  create(context) {
    const check = (node, text) => {
      for (const name of text.split(/s+/).filter(Boolean)) {
        if (/(^|:)font-(mono|code)$/.test(name)) context.report({ node, messageId: "mono", data: { name } });
      }
    };
    return {
      "JSXAttribute[name.name='className'] Literal"(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      "JSXAttribute[name.name='className'] TemplateElement"(node) {
        check(node, node.value.raw);
      },
      "CallExpression[callee.name='cn'] Literal"(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
    };
  },
};

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
    files: ["src/**/*.{ts,tsx}"],
    plugins: { type: { rules: { "no-monospace": noMonospace } } },
    rules: { "type/no-monospace": "error" },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/motion.ts", "src/components/ui/**"],
    rules: { "no-restricted-imports": ["error", motionOnlyInUi] },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/api/**"],
    rules: {
      "no-restricted-globals": ["error", { name: "fetch", message: "Data comes only from src/api/hooks." }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportDeclaration[source.value=/^@supabase\\u002F|api\\u002Fsupabase$|api\\u002Fclient$/]",
          message: "Data comes only from src/api/hooks. Add a hook there instead.",
        },
      ],
    },
  },
  {
    files: ["src/pages/**/*.{ts,tsx}"],
    plugins: { pramaan: { rules: { "layout-only": layoutOnly } } },
    rules: {
      "pramaan/layout-only": "error",
      "no-restricted-syntax": [
        "error",
        { selector: "JSXAttribute[name.name='style']", message: "No style= in pages. Put the styling in a component." },
        {
          selector: "ImportDeclaration[source.value=/^@supabase\\u002F|api\\u002Fsupabase$|api\\u002Fclient$/]",
          message: "Data comes only from src/api/hooks. Add a hook there instead.",
        },
      ],
    },
  },
]);
