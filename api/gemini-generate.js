export async function getAvailableGenerateContentModels(apiKey) {
  const fallbackList = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      return fallbackList;
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.models)) {
      return fallbackList;
    }

    // Filter models supporting generateContent
    const filtered = data.models
      .filter((m) => m && Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
      .map((m) => {
        const name = m.name || "";
        return name.startsWith("models/") ? name.substring("models/".length) : name;
      })
      .filter(Boolean);

    if (filtered.length === 0) {
      return fallbackList;
    }

    // Sort to prioritize gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.5-pro
    const priority = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];
    const ordered = [];
    
    for (const p of priority) {
      if (filtered.includes(p)) {
        ordered.push(p);
      }
    }

    // Add remaining models
    for (const f of filtered) {
      if (!ordered.includes(f)) {
        ordered.push(f);
      }
    }

    return ordered.length > 0 ? ordered : fallbackList;
  } catch (e) {
    return fallbackList;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Phương thức không được hỗ trợ. Vui lòng sử dụng POST." });
  }

  try {
    const { apiKey, mode, fileText, prompt } = req.body || {};
    const trimmedKey = (apiKey || "").trim();

    if (!trimmedKey) {
      return res.status(401).json({ success: false, error: "Vui lòng cấu hình Gemini API Key." });
    }

    let fullPrompt = "";
    let useJsonMode = false;

    if (mode === "preserve_uploaded_structure") {
      useJsonMode = true;
      fullPrompt = `Bạn là một trợ lý ảo thông minh chuyên gia phân tích và chuẩn hóa đề thi trắc nghiệm học tập tại Việt Nam.
Nhiệm vụ của bạn là nhận diện cấu trúc của tài liệu đề thi bên dưới và bóc tách thành định dạng JSON chuẩn.

Nội dung tài liệu tải lên:
========= BẮT ĐẦU VĂN BẢN=========
${fileText || ""}
========= KẾT THÚC VĂN BẢN=========

Yêu cầu tùy biến thêm từ giáo viên (nếu có):
"${prompt || "Không có yêu cầu đặc biệt nào thêm"}"

Hãy phân tích toàn bộ văn bản và trả về kết quả khớp với cấu trúc JSON duy nhất dưới đây:

{
  "success": true,
  "mode": "preserve_uploaded_structure",
  "message": "Trích xuất câu hỏi thành công",
  "examInfo": {
    "title": "Tiêu đề kỳ thi (ví dụ: Đề Ôn Tập Giữa Kỳ)",
    "subject": "Môn học (ví dụ: Toán Học)",
    "grade": "Lớp (ví dụ: 10)",
    "duration": "Thời gian làm bài (ví dụ: 45 phút)",
    "school": "Trường học nếu phát hiện",
    "schoolYear": "Năm học nếu phát hiện"
  },
  "detectedStructure": {
    "hasMultipleChoice": true,
    "hasEssay": false,
    "hasAnswerKey": true,
    "hasScoringGuide": false,
    "hasMatrix": false
  },
  "sections": [
    {
      "sectionTitle": "Tiêu đề phần nếu có (ví dụ: Phần I. Trắc nghiệm)",
      "sectionInstruction": "Hướng dẫn làm bài phần này",
      "questions": [
        {
          "questionNumber": "Số thứ tự câu (ví dụ: Câu 1)",
          "questionText": "Nội dung câu hỏi đầy đủ",
          "options": [
            { "label": "A", "text": "Nội dung đáp án A" },
            { "label": "B", "text": "Nội dung đáp án B" },
            { "label": "C", "text": "Nội dung đáp án C" },
            { "label": "D", "text": "Nội dung đáp án D" }
          ],
          "answer": "Nhãn đáp án đúng phát hiện được (ví dụ: A hoặc B hoặc C hoặc D)",
          "score": "Điểm số nếu có (ví dụ: 0.25)",
          "note": "Lời giải thích chi tiết tại sao chọn đáp án đó (viết bằng tiếng Việt dễ hiểu)"
        }
      ]
    }
  ],
  "answerKey": [],
  "scoringGuide": [],
  "rawFormattedText": "Tóm tắt toàn bộ văn bản đề thi gốc đã định dạng trực quan"
}

LƯU Ý QUAN TRỌNG:
1. Bạn phải đảm bảo trả về định dạng JSON hợp lệ duy nhất, KHÔNG giải thích dông dài phần ngoài JSON, KHÔNG bọc mã trong khối \`\`\`json.
2. Tìm kiếm và bóc tách tất cả các câu hỏi trắc nghiệm từ văn bản. Nếu có đáp án đúng, hãy gán đúng ký tự A, B, C, D vào thuộc tính 'answer'.
3. Hãy rà soát kỹ văn bản thô để tránh bỏ sót câu hỏi. Nếu có lý giải hay giải thích, hãy chuyển vào phần 'note'.
4. Trả về đúng schema JSON của kỳ thi.`;
    } else {
      fullPrompt = prompt || "Hãy chào người dùng bằng tiếng Việt.";
    }

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: fullPrompt
            }
          ]
        }
      ]
    };

    if (useJsonMode) {
      requestBody.generationConfig = {
        temperature: 0.2,
        responseMimeType: "application/json"
      };
    }

    // Load available models and try them
    const candidateModels = await getAvailableGenerateContentModels(trimmedKey);
    const triedModels = [];
    let lastError = "";

    for (const model of candidateModels) {
      triedModels.push(model);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(trimmedKey)}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();

        if (!response.ok) {
          let errorMessage = `Lỗi từ server ${model}`;
          try {
            const errorJson = JSON.parse(responseText);
            if (errorJson?.error?.message) {
              errorMessage = errorJson.error.message;
            }
          } catch (e) {
            errorMessage = responseText || `Status ${response.status}`;
          }

          const isModelNotFoundError = 
            errorMessage.toLowerCase().includes("not found") || 
            errorMessage.toLowerCase().includes("not supported") || 
            errorMessage.toLowerCase().includes("models/");

          if (isModelNotFoundError && triedModels.length < candidateModels.length) {
            // Log & continue retry
            console.warn(`Model ${model} không hợp lệ hoặc không có quyền truy cập, chuyển sang model tiếp theo...`);
            lastError = errorMessage;
            continue;
          } else {
            // Not a model-not-found error, or we ran out of models
            return res.status(response.status || 400).json({ 
              success: false, 
              error: `Lỗi từ Gemini: ${errorMessage}`,
              triedModels 
            });
          }
        }

        // Response is OK
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(responseText);
        } catch (e) {
          return res.status(500).json({ success: false, error: "Không thể phân tích phản hồi gốc là JSON từ máy chủ Google API." });
        }

        const textOutput = parsedResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOutput) {
          return res.status(500).json({ success: false, error: "Không tìm thấy nội dung phản hồi từ mô hình AI." });
        }

        return res.status(200).json({
          success: true,
          modelUsed: model,
          text: textOutput,
          data: parsedResponse
        });
      } catch (err) {
        lastError = err.message || err;
        if (triedModels.length < candidateModels.length) {
          continue;
        }
      }
    }

    return res.status(500).json({
      success: false,
      error: `Không tìm thấy model Gemini phù hợp với API key này. Chi tiết lỗi cuối cùng: ${lastError}`,
      triedModels
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Lỗi xử lý nội bộ hệ thống." });
  }
}
