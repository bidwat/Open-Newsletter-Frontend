import { NextResponse } from "next/server";
import { addMailingListContact, fetchMailingListContacts } from "@/src/lib/api";

interface ContactRouteContext {
  params: Promise<{
    listId: string;
  }>;
}

export async function GET(request: Request, { params }: ContactRouteContext) {
  const { listId } = await params;
  if (!listId) {
    return NextResponse.json({ error: "Missing list ID" }, { status: 400 });
  }

  const result = await fetchMailingListContacts(listId);

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}

export async function POST(request: Request, { params }: ContactRouteContext) {
  try {
    const { listId } = await params;
    if (!listId) {
      return NextResponse.json({ error: "Missing list ID" }, { status: 400 });
    }

    const body = await request.json();
    const result = await addMailingListContact(listId, body);

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
