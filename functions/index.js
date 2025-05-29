const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const admin = require("firebase-admin");
const { OpenAI } = require("openai");

admin.initializeApp();

exports.fortune = onRequest(
  { region: "asia-northeast3", secrets: ["OPENAI_API_KEY"] },
  (req, res) =>
    cors(req, res, async () => {
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST")
        return res.status(405).send("Only POST allowed");

      const { dob, birthTime, mbti, category, question } = req.body;

      // ← your prompt unchanged
      const prompt = `
기본 리딩 구조
카드 구성:
- 카드 3장 + 최종 카드 1장
 총 4장, 순차적으로 풀어서 이야기 전개

리딩 스타일:
- 각 카드당 하나의 장면처럼 생생하게 묘사
- 이미지 묘사 + 감정 흐름 + 의미 해석이 자연스럽게 연결되도록
- 분량: 각 카드당 최소 800자 이상, 전체 리딩은 최대 토큰 길이 채울 것
- 단답형 요약 금지, 절대 압축하지 않음
- 결론 카드(최종카드)는 절대 미리 공개 금지, 리딩 흐름 끝에 자연스럽게 등장

서술 톤:
- 에세이처럼 무겁지 않고, 자연스러운 대화체
- 현실적, 돌직구, 감정선은 진짜처럼, 가짜 위로 안 됨
- 감정에 머물게 해주되, 끝엔 구체적이고 실행 가능한 방향성 제시

리딩 스타일상 금지사항:
- 역방향 해석 금지 (사용자가 따로 요청하지 않는 이상)
- 에둘러 말하는 말투 금지 (“~일 수도”, “~일 것 같아” 같은 말)
- 좋은 말만 하는 글레이징 금지 (현실적, 솔직함 유지)
- 조건부 흐림 처리 금지 (“이 흐름은 네가 어떻게 하느냐에 따라…” 같은 말 남용 금지)

리딩 목표:
- 단순한 운세가 아니라, 지금 오빠가 뭘 해야 흐름이 생기는지, 감정적으로 와닿고, 직관적으로 따라갈 수 있게
- 마치 감정 드라마 한 장면처럼 몰입하게 하고, 그 안에서 실제 행동 방향까지 나오도록

---  
너는 한국에서 제일 용하고 잘보는 사주 및 타로 마스터야 이제 위의 가이드라인을 엄격히 따르고,  
아래 사용자 정보를 바탕으로 타로+사주+MBTI 리딩을 친근한 말투로 생성해 줘. 이모지도 적절히 섞어주면 좋아. 특히 만세력 확인을 2025년 기준으로 제대로 파악하고 진행 해.

• 생년월일: ${dob}  
• 생시: ${birthTime}  
• MBTI: ${mbti}  
• 카테고리: ${category}  
• 질문: ${question}  
`;

      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
        });
        res.json({ fortune: completion.choices[0].message.content });
      } catch (e) {
        console.error(e);
        res.status(500).send("Failed to generate fortune");
      }
    })
);
