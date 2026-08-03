import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.API_MODE !== "real") {
    return NextResponse.json({ status: "ok", apiMode: "mock" });
  }

  const baseUrl = process.env.NEST_API_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { status: "error", apiMode: "real", message: "NEST_API_URL não configurado" },
      { status: 500 },
    );
  }

  try {
    const upstream = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
    return NextResponse.json(
      { status: upstream.ok ? "ok" : "degraded", apiMode: "real", upstreamStatus: upstream.status },
      { status: upstream.ok ? 200 : 502 },
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", apiMode: "real", message: (error as Error).message },
      { status: 502 },
    );
  }
}
