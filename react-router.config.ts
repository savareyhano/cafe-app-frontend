import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode: the browser talks to the API directly so the cross-site HttpOnly auth cookie works.
  ssr: false,
} satisfies Config;
