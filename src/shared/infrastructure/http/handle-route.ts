import { NextResponse } from "next/server";
import { ApiError } from "./api-error";

type RouteContext<Params> = { params: Promise<Params> };
type RouteHandler<Params> = (
  request: Request,
  context: RouteContext<Params>,
) => Promise<NextResponse>;

export function handleRoute<Params = Record<string, never>>(
  handler: RouteHandler<Params>,
): RouteHandler<Params> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (
        error instanceof ApiError ||
        (error &&
          typeof error === "object" &&
          "statusCode" in error &&
          typeof (error as { statusCode: unknown }).statusCode === "number")
      ) {
        const apiErr = error as { statusCode: number; message: string };
        return NextResponse.json(
          { statusCode: apiErr.statusCode, message: apiErr.message },
          { status: apiErr.statusCode },
        );
      }
      console.error("[handleRoute uncaught error]", error);
      return NextResponse.json(
        { statusCode: 500, message: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
