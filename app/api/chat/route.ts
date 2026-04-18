import Anthropic from "@anthropic-ai/sdk";
import { CASES } from "@/lib/cases";

const client = new Anthropic();

export async function POST(request: Request) {
  const { caseId, messages } = await request.json();

  const caseData = CASES[caseId];
  if (!caseData) {
    return Response.json({ error: "케이스를 찾을 수 없습니다" }, { status: 404 });
  }

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: caseData.systemPrompt,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
