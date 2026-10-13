import { expect, test } from "vitest";
import { problemError } from "./problem-error";

const response = (status: number, body: unknown) => ({ status, json: async () => body });

test("a problem body becomes its title and detail", async () => {
  const error = await problemError(response(409, { title: "Conflict", detail: "Try again." }));
  expect(error.message).toBe("Conflict. Try again.");
});

test("a server error shows a plain message instead of the API title", async () => {
  const error = await problemError(response(500, { title: "Internal Server Error" }));
  expect(error.message).toBe("We could not complete this request. Try again in a few minutes.");
});

test("a 503 problem keeps the message the API wrote, and the error carries the status", async () => {
  const error = await problemError(
    response(503, { title: "We do not accept new reports at the moment. Try again later." }),
  );
  expect(error.message).toBe("We do not accept new reports at the moment. Try again later.");
  expect(error.status).toBe(503);
});
