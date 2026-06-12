export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Phương thức không được hỗ trợ. Vui lòng sử dụng POST." });
  }

  try {
    const { apiKey } = req.body || {};
    const trimmedKey = (apiKey || "").trim();

    if (!trimmedKey) {
      return res.status(400).json({ success: false, error: "Vui lòng nhập Gemini API key." });
    }

    // Call the models endpoint via GET to check key legitimacy
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`, {
      method: "GET"
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = "API key không hợp lệ hoặc chưa được cấp quyền sử dụng Gemini API.";
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson?.error?.message) {
          if (errorJson.error.message.includes("API key not valid")) {
            errorMessage = "Khóa API Gemini không tồn tại hoặc đã bị thu hồi. Vui lòng tạo khóa mới.";
          } else {
            errorMessage = `Lỗi từ Google: ${errorJson.error.message}`;
          }
        }
      } catch (e) {
        // Handled fallback above
      }
      return res.status(401).json({ success: false, error: errorMessage });
    }

    // Check if the response contains valid JSON
    try {
      JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ success: false, error: "Không thể phân tích phản hồi từ máy chủ Google API." });
    }

    return res.status(200).json({ success: true, message: "API key hợp lệ" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Lỗi kết nối hoặc xử lý nội bộ: " + (error.message || error) });
  }
}
