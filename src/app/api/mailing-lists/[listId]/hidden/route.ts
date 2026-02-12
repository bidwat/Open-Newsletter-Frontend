import { NextResponse } from "next/server";
import { toggleMailingListHidden } from "@/src/lib/api";

interface MailingListHiddenContext {
  params: Promise<{
    listId: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: MailingListHiddenContext,
) {
  const { listId } = await params;
  if (!listId) {
    return NextResponse.json({ error: "Missing list ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    if (typeof body?.hidden !== "boolean") {
      return NextResponse.json(
        { error: "Missing hidden flag" },
        { status: 400 },
      );
    }

    const result = await toggleMailingListHidden(listId, body.hidden);

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
