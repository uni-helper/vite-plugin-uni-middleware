export interface Options {
  /**
   * @default process.env.UNI_INPUT_DIR || process.cwd()
   */
  cwd: string
  /**
   * @default "uni-middleware.d.ts"
   */
  dts: string
  /**
   * @default `${cwd}/middleware`
   */
  middlewareDir: string
}

export interface UserOptions extends Partial<Options> {}

export interface ResolvedOptions extends Options {
  pagesJsonPath: string
}

export interface MiddlewareFile {
  name: string
  value: string
  path: string
}
