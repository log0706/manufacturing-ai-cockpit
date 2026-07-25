import type { Dictionary } from "../i18n/ja";

/**
 * Error codes raised by the FUGU review client.
 *
 * The client is a library, not a component, so it must not reach for a dictionary or a
 * React context. It throws a code instead, and the calling page turns that code into
 * text for the active locale via `fuguErrorMessage`. This is what keeps the FUGU error
 * path localized rather than hard-coded Japanese.
 */
export type FuguErrorCode =
  | "emptyAnswer"
  | "tooLong"
  | "jsonParse"
  | "timeout"
  | "failed";

export class FuguReviewError extends Error {
  readonly code: FuguErrorCode;
  /** Character limit, set only for the `tooLong` code. */
  readonly max?: number;
  /**
   * Text supplied by the local review server. When present it is shown verbatim rather
   * than replaced by a dictionary string, because the server knows more about the
   * specific failure than the client does.
   */
  readonly serverMessage?: string;

  constructor(code: FuguErrorCode, options: { max?: number; serverMessage?: string } = {}) {
    super(options.serverMessage ?? code);
    this.name = "FuguReviewError";
    this.code = code;
    this.max = options.max;
    this.serverMessage = options.serverMessage;
  }
}

/** Resolves any error thrown by the review flow into a message for the active locale. */
export const fuguErrorMessage = (error: unknown, t: Dictionary): string => {
  if (error instanceof FuguReviewError) {
    if (error.serverMessage) return error.serverMessage;
    switch (error.code) {
      case "emptyAnswer":
        return t.errors.fuguEmptyAnswer;
      case "tooLong":
        return t.errors.fuguTooLong(error.max ?? 0);
      case "jsonParse":
        return t.errors.fuguJsonParse;
      case "timeout":
        return t.errors.fuguTimeout;
      case "failed":
        return t.errors.fuguFailed;
    }
  }
  // An unexpected error (network stack, coercion bug) still needs locale-correct text
  // rather than a raw English exception message leaking into a Japanese screen.
  return t.errors.fuguFailed;
};
