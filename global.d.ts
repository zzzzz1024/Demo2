declare module '*?raw' {
  const content: string;
  export default content;
}
<<<<<<< HEAD
declare module '*.html' {
=======
declare module '*?url' {
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
  const content: string;
  export default content;
}
declare module '*.css' {
  const content: unknown;
  export default content;
}
<<<<<<< HEAD
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
=======
declare module '*.html' {
  const content: string;
  export default content;
}
declare module '*.md' {
  const content: string;
  export default content;
}
declare module '*.yaml' {
  const content: any;
  export default content;
}
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent;
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
  export default component;
}

declare const YAML: typeof import('yaml');

declare const z: typeof import('zod');
declare namespace z {
  export type infer<T> = import('zod').infer<T>;
  export type input<T> = import('zod').input<T>;
  export type output<T> = import('zod').output<T>;
}
<<<<<<< HEAD
=======

declare module 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js' {
  export function registerMvuSchema(
    schema: z.ZodType<Record<string, any>> | (() => z.ZodType<Record<string, any>>),
  ): void;
}
>>>>>>> fdfcbc5386747889d0b011123d4dde6612c67d1b
