export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Phương thức không được hỗ trợ. Vui lòng sử dụng POST." });
  }

  try {
    const { apiKey, prompt } = req.body || {};
    const trimmedKey = (apiKey || "").trim();

    if (!trimmedKey) {
      return res.status(401).json({ success: false, error: "Vui lòng nhập Gemini API Key." });
    }

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Nội dung prompt yêu cầu không được rỗng." });
    }

    const DEFAULT_MODEL = "gemini-1.5-flash";
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
        ]
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = "Không thể sinh nội dung từ Gemini API.";
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson?.error?.message) {
          errorMessage = `Lỗi từ Gemini: ${errorJson.error.message}`;
        }
      } catch (e) {}
      return res.status(response.status || 400).json({ success: false, error: errorMessage });
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ success: false, error: "Không thể phân tích phản hồi từ máy chủ Google API." });
    }

    const textOutput = parsedResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOutput) {
      return res.status(500).json({ success: false, error: "Không tìm thấy nội dung phản hồi từ mô hình AI." });
    }

    return res.status(200).json({ success: true, text: textOutput, data: parsedResponse });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Lỗi xử lý nội bộ." });
  }
}
