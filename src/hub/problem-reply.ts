import { STATUS_CODES } from "node:http";
import type { Context, ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

const PROBLEM_CONTENT_TYPE = "application/problem+json";
const INTERNAL_ERROR_STATUS = 500;

interface Problem {
  type: "about:blank";
  title: string;
  status: ContentfulStatusCode;
  detail: string;
}

const createProblem = (
  status: ContentfulStatusCode,
  detail: string,
): Problem => ({
  type: "about:blank",
  title: STATUS_CODES[status] ?? "Unknown status",
  status,
  detail,
});

const sendProblem = (c: Context, problem: Problem): Response => {
  const serializedProblem = JSON.stringify(problem);
  return c.newResponse(serializedProblem, problem.status, {
    "Content-Type": PROBLEM_CONTENT_TYPE,
  });
};

export const writeProblem: ErrorHandler = (error, c) => {
  const isKnownError = error instanceof HTTPException;
  if (isKnownError)
    return sendProblem(c, createProblem(error.status, error.message));
  console.error({ error });
  return sendProblem(
    c,
    createProblem(INTERNAL_ERROR_STATUS, "Unexpected error"),
  );
};
