declare module "downsize" {
  type opts = {
    contextualTags?: string[];
    append?: string;
    round?: boolean;
  } & (
    | {
        words?: number;
      }
    | {
        characters?: number;
      }
  );

  export default function downsize(
    text: string,
    inputOptions: opts,
    offset?: number
  ): string;
}
