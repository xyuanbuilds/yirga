// export type FieldPath = Array<string | number | FieldPath>;

type PathSegments = string | number;
export interface Path {
  entries: string;
  segments: PathSegments;
}
