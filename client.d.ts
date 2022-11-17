declare module "virtual:uni-middleware" {
  import type { ComponentPublicInstance } from "vue";

  interface Page extends ComponentPublicInstance {
    $mpType: string;
    $pages: Record<string, any>;
    $vm: Page;
    route: string;
  }

  export type MiddlewareReturn =
    | void
    | boolean
    | string
    | {
        url: string;
        method: "navigateTo" | "redirectTo" | "switchTab" | "reLaunch";
        options: Record<string, any>;
      };
  export type Middleware = (to: Page, from: Page) => MiddlewareReturn;

  export const middlewares: {
    global: Middleware[];
    [x: string]: Middleware[];
  };
}
