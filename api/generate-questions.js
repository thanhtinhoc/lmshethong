export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Phương thức không được hỗ trợ. Vui lòng sử dụng POST." });
  }

  try {
    const { subject, topic, grade, quantity, apiKey } = req.body || {};
    const key = apiKey || req.headers["x-gemini-api-key"];
    const trimmedKey = (key || "").trim();

    if (!trimmedKey) {
      return res.status(401).json({ success: false, error: "Vui lòng nhập Gemini API Key hoặc lưu trong phần Cấu hình." });
    }

    if (!subject || !topic) {
      return res.status(400).json({ success: false, error: "Thiếu môn học hoặc chủ đề ôn tập." });
    }

    const numQuestions = Math.min(Math.max(Number(quantity || 5), 1), 10);
    const DEFAULT_MODEL = "gemini-1.5-flash";

    const prompt = `Soạn đề ôn tập trắc nghiệm môn ${subject}, chủ đề: "${topic}", trình độ cho học sinh lớp ${grade || 'mọi cấp độ'}.
Yêu cầu soạn đúng ${numQuestions} câu hỏi trắc nghiệm, mỗi câu gồm 4 đáp án lựa chọn (A, B, C, D).
Cách câu hỏi cần bám sát kiến thức thực tế, rõ ràng, sư phạm tốt, có đáp án nhiễu hợp lý và có lời giải thích chi tiết tại sao chọn đáp án đó.
Dịch và viết hoàn toàn bằng tiếng Việt chính xác.
Trả về định dạng JSON array chứa các đối tượng có thuộc tính:
- "questionText": câu hỏi (không kèm số thứ tự như "Câu 1:")
- "options": mảng gồm đúng 4 chuỗi đáp án (không gồm tiền tố "A. ", "B. ", v.v.)
- "correctIndex": số nguyên 0, 1, 2, hoặc 3 tương ứng với đáp án đúng (0=A, 1=B, 2=C, 3=D)
- "explanation": giải thích rõ ràng tại sao đáp án đó đúng.

Chỉ xuất ra đúng mảng JSON, không thêm bất cứ văn bản giải thích hay lời mở đầu nào ngoài JSON.`;

    const systemInstruction = "Bạn là giáo viên giàu kinh nghiệm tại Việt Nam chuyên soạn các đề thi trắc nghiệm khách quan chuẩn sư phạm. Bạn chỉ xuất thông tin dưới dạng mảng JSON chứa các câu hỏi theo cấu trúc được yêu cầu. Không thêm bớt bất kỳ mô tả nào ngoài mảng JSON.";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${trimmedKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        },
        systemInstruction: {
          parts: [
            {
              text: systemInstruction
            }
          ]
        }
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = "Không thể sinh câu hỏi bằng AI.";
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson?.error?.message) {
          errorMessage = `Lỗi từ Gemini: ${errorJson.error.message}`;
        }
      } catch (e) {}
      return res.status(response.status || 400).json({ success: false, error: errorMessage });
    }

    const resData = JSON.parse(responseText);
    const textOutput = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      return res.status(500).json({ success: false, error: "Không nhận được phản hồi nội dung từ Gemini API." });
    }

    // Clean JSON helpers
    let cleaned = textOutput.trim();
    const startMatch = cleaned.match(/^```(?:json)?\s*/i);
    if (startMatch) {
      cleaned = cleaned.substring(startMatch[0].length);
    }
    cleaned = cleaned.replace(/\s*```$/, "");
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }

    let quizData;
    try {
      quizData = JSON.parse(cleaned);
    } catch (e) {
      // Return raw parsed heuristic or try cleaning again
      return res.status(500).json({ success: false, error: "Phản hồi từ AI không đúng cấu trúc JSON mong đợi. Vui lòng bấm thử lại." });
    }

    return res.status(200).json({ success: true, data: quizData });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Lỗi máy chủ nội bộ." });
  }
}
