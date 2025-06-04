// Type declarations for Astro components
declare module "*.astro" {
  import type {
    ComponentProps,
    AstroComponentFactory,
  } from "astro/runtime/server/index.js";

  const Component: AstroComponentFactory;
  export default Component;

  export type Props = ComponentProps<typeof Component>;
}
