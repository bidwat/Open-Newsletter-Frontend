import { NextResponse } from "next/server";
import { copyMailingList } from "@/src/lib/api";

interface MailingListRouteContext {
  params: Promise<{
    listId: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: MailingListRouteContext,
) {
  const { listId } = await params;
  if (!listId) {
    return NextResponse.json({ error: "Missing list ID" }, { status: 400 });
  }

  const result = await copyMailingList(listId);

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}
