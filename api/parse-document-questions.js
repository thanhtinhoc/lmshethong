import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
const mammoth = require("mammoth");

function parseQuizTextHeuristic(text) {
  const questions = [];
  const lines = text.split(/\r?\n/);
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const isQuestionMatch = line.match(/^(?:Câu|câu|Cau|cau|Question|question)\s*\d+[\s:.-]+(.*)$/i) || line.match(/^\d+\.\s+(.*)$/);
    
    if (isQuestionMatch) {
      if (currentQuestion && currentQuestion.questionText && currentQuestion.options.filter(Boolean).length >= 2) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        questionText: isQuestionMatch[1].trim(),
        options: [],
        correctIndex: 0,
        explanation: "Được tự động nhận diện bằng bộ lọc nội dung dự phòng thông minh."
      };
      continue;
    }

    if (currentQuestion) {
      const optionMatch = line.match(/^([A-D])[\s.)-]\s*(.*)$/i);
      if (optionMatch) {
        const optionLetter = optionMatch[1].toUpperCase();
        const optionText = optionMatch[2].trim();
        const optIdx = optionLetter.charCodeAt(0) - 65;
        currentQuestion.options[optIdx] = optionText;
        continue;
      }

      const ansMatch = line.match(/(?:đáp án đúng|đáp án|chọn|đáp án:|đáp án đúng:)\s*([A-D])/i);
      if (ansMatch) {
        const ansLetter = ansMatch[1].toUpperCase();
        currentQuestion.correctIndex = ansLetter.charCodeAt(0) - 65;
        continue;
      }
      
      const expMatch = line.match(/^(?:Giải thích|Lời giải|Lời giải chi tiết|gỉải thích)[:.-]?\s*(.*)$/i);
      if (expMatch) {
        currentQuestion.explanation = expMatch[1].trim();
        continue;
      }

      if (currentQuestion.options.filter(Boolean).length === 0) {
        currentQuestion.questionText += " " + line;
      } else {
        if (line.toLowerCase().includes("giải thích") || line.toLowerCase().includes("lời giải")) {
          currentQuestion.explanation = line;
        }
      }
    }
  }

  if (currentQuestion && currentQuestion.questionText && currentQuestion.options.filter(Boolean).length >= 2) {
    questions.push(currentQuestion);
  }

  return questions.map(q => {
    const options = [];
    for (let oIdx = 0; oIdx < 4; oIdx++) {
      options.push(q.options[oIdx] || `Lựa chọn ${String.fromCharCode(65 + oIdx)}`);
    }

    return {
      questionText: q.questionText.trim(),
      options: options,
      correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < 4 ? q.correctIndex : 0,
      explanation: q.explanation ? q.explanation.trim() : "Giải thích chi tiết theo giáo trình chuẩn ôn tập."
    };
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Phương thức không được hỗ trợ. Vui lòng sử dụng POST." });
  }

  try {
    const { fileBase64, fileName, fileMimeType, subject, grade, apiKey } = req.body || {};
    const key = apiKey || req.headers["x-gemini-api-key"];
    const trimmedKey = (key || "").trim();

    if (!fileBase64) {
      return res.status(400).json({ success: false, error: "Thiếu dữ liệu tệp tải lên (Base64)." });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    let extractedText = "";

    const lowerName = (fileName || "").toLowerCase();
    const lowerMime = (fileMimeType || "").toLowerCase();

    if (lowerName.endsWith(".pdf") || lowerMime.includes("pdf")) {
      try {
        const parsed = await pdf(buffer);
        extractedText = parsed.text || "";
      } catch (pdfErr) {
        return res.status(400).json({ success: false, error: "Không thể trích xuất văn bản từ tệp PDF này. Vui lòng thử lại." });
      }
    } else if (lowerName.endsWith(".doc")) {
      return res.status(400).json({ success: false, error: "Tệp .doc không được hỗ trợ. Vui lòng lưu dưới dạng .docx hoặc .txt." });
    } else if (lowerName.endsWith(".docx") || lowerMime.includes("wordprocessingml") || lowerMime.includes("msword")) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || "";
      } catch (docxErr) {
        return res.status(400).json({ success: false, error: "Không thể trích xuất văn bản từ tệp Word (.docx)." });
      }
    } else {
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Không tìm thấy nội dung văn bản nào trong tệp vừa tải lên." });
    }

    const parsePrompt = `Phân tích và nhận dạng nội dung của văn bản ôn tập/thi dưới đây để trích xuất ra toàn bộ các câu hỏi trắc nghiệm khách quan dạng 4 lựa chọn (A, B, C, D) tuân theo đúng mẫu chuẩn.

Môn học đề nghị: ${subject || "Phát hiện tự động"}
Khối lớp đề nghị: Lớp ${grade || "Phát hiện tự động"}

Nội dung văn bản thô được giải mã từ tài liệu:
========= NỘI DUNG VĂN BẢN KHỞI ĐẦU =========
${extractedText}
========= NỘI DUNG VĂN BẢN KẾT THÚC =========

Yêu cầu nhiệm vụ phân tích cực kỳ nghiêm ngặt:
1. Bạn phải tìm tất cả các câu hỏi trắc nghiệm trong văn bản trên. Mỗi câu trắc nghiệm dạng này thường gồm phần câu hỏi, tiếp theo là 4 lựa chọn (ví dụ: A. ..., B. ..., C. ..., D. ...) và có thể kèm theo "Đáp án đúng: X" hoặc lời giải ở dưới.
2. Với mỗi câu hỏi trắc nghiệm tìm thấy:
  - 'questionText': Là nội dung đầy đủ của câu hỏi. KHÔNG bao gồm phần số thứ tự ở đầu.
  - 'options': Phải là một mảng gồm CHÍNH XÁC 4 phần tử chuỗi ký tự tương ứng với 4 lựa chọn A, B, C, D (đã cắt bỏ ký tự "A. ", "B. ", vv).
  - 'correctIndex': Chỉ số của đáp án đúng (số nguyên từ 0 đến 3).
  - 'explanation': Lời giải thích khoa học, súc tích và mạch lạc cho câu hỏi đó bằng tiếng Việt.

Chỉ xuất thông tin dưới dạng mảng JSON chứa các đối tượng có cấu trúc định nghĩa trên. Không thêm bớt bất kỳ mô tả nào ngoài mảng JSON.`;

    let quizData = [];
    let isFallback = false;

    if (trimmedKey) {
      const DEFAULT_MODEL = "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${trimmedKey}`;

      try {
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
                    text: parsePrompt
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
                  text: "Bạn là một trợ lý ảo thông minh chuyên nhận dạng đề thi và chuyển đổi tài liệu thô PDF/DOCX sang định dạng mảng JSON câu hỏi trắc nghiệm chuẩn chỉnh của Việt Nam."
                }
              ]
            }
          })
        });

        if (response.ok) {
          const responseText = await response.text();
          const resData = JSON.parse(responseText);
          const textOutput = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (textOutput) {
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
            quizData = JSON.parse(cleaned);
          }
        } else {
          isFallback = true;
        }
      } catch (geminiError) {
        isFallback = true;
      }
    } else {
      isFallback = true;
    }

    if (isFallback || quizData.length === 0) {
      quizData = parseQuizTextHeuristic(extractedText);
      isFallback = true;
    }

    if (!quizData || quizData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Không thể tự động nhận dạng được câu hỏi trắc nghiệm nào từ tệp tin này cả bằng AI và bộ lọc thô dự phòng. Hãy dán trực tiếp đề ôn tập của bạn vào mục soạn thảo." 
      });
    }

    return res.status(200).json({ 
      success: true, 
      count: quizData.length, 
      data: quizData, 
      isFallback 
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: "Lỗi xử lý tài liệu thô: " + (error.message || error) });
  }
}
