/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

declare type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}
