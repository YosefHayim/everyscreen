import { HTTPException } from "hono/http-exception";

const BAD_REQUEST_STATUS = 400;

interface RequestValidation {
  success: boolean;
  error?: unknown;
}

export const rejectInvalidRequest = (validation: RequestValidation): void => {
  const isRequestInvalid = validation.success === false;
  if (isRequestInvalid) {
    throw new HTTPException(BAD_REQUEST_STATUS, {
      message: "The request does not match the schema.",
      cause: validation.error,
    });
  }
};
