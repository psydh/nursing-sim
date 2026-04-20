import { GoogleGenerativeAI } from "@google/generative-ai";
import { CASES } from "@/lib/cases";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const REQUEST_OPTIONS = { apiVersion: "v1" };

export async function POST(request: Request) {
  const { caseId, conversation, evaluationType, mseContent } = await request.json();

  const caseData = CASES[caseId];
  if (!caseData) {
    return Response.json({ error: "케이스를 찾을 수 없습니다" }, { status: 404 });
  }

  const conversationText = conversation
    .map((m: { role: string; content: string }) => `${m.role === "user" ? "간호학생" : "환자"}: ${m.content}`)
    .join("\n");

  let prompt = "";

  const scoreInstruction = `\n\n평가 마지막에 반드시 아래 형식으로 점수를 작성하세요 (다른 텍스트 없이 이 줄만):\n총점: X/10`;

  if (evaluationType === "mse") {
    prompt = `다음은 간호학생과 정신과 환자의 대화입니다:\n\n${conversationText}\n\n학생이 작성한 MSE 사정 내용:\n${mseContent}\n\n위 대화에서 실제로 나타난 환자의 정신 상태와 학생이 작성한 MSE 사정 내용을 비교하여 구체적으로 평가해주세요. 다음 항목별로 평가하세요:\n1. 외모 및 행동 (Appearance & Behavior)\n2. 언어 (Speech)\n3. 기분 및 정동 (Mood & Affect)\n4. 사고 과정 및 내용 (Thought Process & Content)\n5. 지각 (Perception)\n6. 인지 (Cognition)\n7. 병식 및 판단 (Insight & Judgment)\n\n각 항목마다 대화에서 관찰된 실제 내용과 학생의 사정 내용을 비교하고, 누락되거나 잘못 평가된 부분이 있으면 구체적으로 지적해주세요.${scoreInstruction}`;
  } else if (evaluationType === "communication") {
    prompt = `다음은 간호학생과 정신과 환자의 대화입니다:\n\n${conversationText}\n\n위 대화를 바탕으로 학생이 대상자에게 제공한 치료적 의사소통 기술을 평가해주세요. 다음 항목을 포함하여 평가하세요:\n1. 치료적 의사소통 기술 사용 여부 (적극적 경청, 반영, 명료화, 공감 등)\n2. 비치료적 의사소통 발생 여부 및 사례\n3. 공감적 태도와 수용적 반응\n4. 잘한 점\n5. 개선이 필요한 부분과 대안적 표현 제시${scoreInstruction}`;
  } else if (evaluationType === "procedure") {
    prompt = `다음은 간호학생과 정신과 환자의 대화입니다:\n\n${conversationText}\n\n위 대화에서 학생이 입·퇴원 절차에 대해 설명하고 안내한 내용을 평가해주세요. 다음 항목을 포함하여 평가하세요:\n1. 정신과 입·퇴원 절차 설명의 정확성 및 완결성\n2. 환자의 권리 보호 (동의, 고지, 퇴원 요청 절차 등)\n3. 지역사회 연계 및 퇴원 후 계획 수립 내용 (해당 시)\n4. 잘한 점\n5. 누락되거나 보완이 필요한 절차 설명${scoreInstruction}`;
  } else if (evaluationType === "intervention") {
    prompt = `다음은 간호학생과 정신과 환자의 대화입니다:\n\n${conversationText}\n\n위 대화에서 학생이 제공한 조현병 대상자 간호중재를 평가해주세요. 다음 항목을 포함하여 평가하세요:\n1. 언어적 간호중재의 적절성 (설명 방식, 설득 전략, 약물 복용 필요성 안내 등)\n2. 학생이 보고한 비언어적 간호활동의 적절성 (자세, 표정, 거리 유지, 안전 확보 등)\n3. 대상자의 병식 부족 또는 저항에 대한 대응 방식\n4. 안전 관리 및 위험 요소 평가 내용\n5. 잘한 점\n6. 개선이 필요한 부분${scoreInstruction}`;
  } else if (evaluationType === "injection") {
    prompt = `다음은 간호학생과 정신과 환자의 대화입니다:\n\n${conversationText}\n\n위 대화에서 학생이 근육주사(IM) 투여 과정에서 수행한 언어적·비언어적 간호행위의 적절성을 평가해주세요. 다음 항목을 포함하여 평가하세요:\n1. 주사 전 환자 설명 및 동의 절차\n2. 환자의 불안·저항 관리를 위한 언어적 접근\n3. 학생이 보고한 비언어적 간호행위 (안전한 자세, 접근 방식, 억제 방법 등)\n4. 주사 후 모니터링 및 상태 확인 안내\n5. 잘한 점\n6. 개선이 필요한 부분${scoreInstruction}`;
  }

  const model = client.getGenerativeModel({ model: "gemini-2.5-flash" }, REQUEST_OPTIONS);
  const result = await model.generateContentStream(prompt);

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          controller.enqueue(new TextEncoder().encode(text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
