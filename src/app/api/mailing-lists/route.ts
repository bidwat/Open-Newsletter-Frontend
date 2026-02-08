import { NextResponse } from "next/server";
import { createMailingList, fetchMailingLists } from "@/src/lib/api";

export async function GET() {
  const result = await fetchMailingLists();

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createMailingList(body);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
