import type { ComponentPublicInstance } from "vue";
export interface Options {
  pages: {
    path: string;
    [x: string]: any;
  }[];
}

export interface UserOptions extends Partial<Options> {}
export interface ResolvedOptions extends Options {}

export interface Page extends ComponentPublicInstance {
  $mpType: string;
  $pages: Record<string, any>;
  $vm: Page;
  route: string;
}
