export type TupleToUnion<T extends unknown[]> = T[number]; // Turns as const tuple to union.
export type Writeable<T> = { -readonly [P in keyof T]: T[P] }; // as const produces readonly types.
export type Extends<T extends V, V> = T; // Validates fields.
export type FieldsToObject<T extends string, V> = {
  [key in T]?: V;
};
