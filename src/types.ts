export interface Options {
  /**
   * @default "src/middleware"
   */
  middlewareDir: string;
}

export interface UserOptions extends Partial<Options> {}

export interface ResolvedOptions extends Options {}

export interface Middleware {
  path: string;
  /**
   * found name
   */
  name: string;
  /**
   * import name
   */
  value: string;
}
