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
      if (error instanceof ApiError) {
        return NextResponse.json(
          { statusCode: error.statusCode, message: error.message },
          { status: error.statusCode },
        );
      }
      return NextResponse.json(
        { statusCode: 500, message: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
