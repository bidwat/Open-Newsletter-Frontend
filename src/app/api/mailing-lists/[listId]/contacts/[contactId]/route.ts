import { NextResponse } from "next/server";
import {
  removeMailingListContact,
  updateMailingListContact,
} from "@/src/lib/api";

interface ContactRouteContext {
  params: Promise<{
    listId: string;
    contactId: string;
  }>;
}

export async function PUT(request: Request, { params }: ContactRouteContext) {
  const { listId, contactId } = await params;
  if (!listId || !contactId) {
    return NextResponse.json(
      { error: "Missing list or contact ID" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const result = await updateMailingListContact(listId, contactId, body);

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

export async function DELETE(
  request: Request,
  { params }: ContactRouteContext,
) {
  const { listId, contactId } = await params;
  if (!listId || !contactId) {
    return NextResponse.json(
      { error: "Missing list or contact ID" },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const softDeleteParam = url.searchParams.get("softDelete");
  const softDelete =
    softDeleteParam === null ? undefined : softDeleteParam === "true";

  const result = await removeMailingListContact(listId, contactId, softDelete);

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}
