import { NextResponse } from "next/server";
import { answerConsumerQuestion } from "@/lib/ai";

// POST /api/ai/chatbot — endpoint public pour le chatbot consommateur
// Body: { productId, question }
export async function POST(req: Request) {
  const body = await req.json();
  const { productId, question } = body;

  if (!productId || !question) {
    return NextResponse.json({ error: "productId et question requis" }, { status: 400 });
  }

  const result = await answerConsumerQuestion(productId, question);
  return NextResponse.json(result);
}
