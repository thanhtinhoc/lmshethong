import { Quiz, StudentSubmission } from "./types";

export const SAMPLE_QUIZZES: Quiz[] = [
  {
    id: "q1",
    code: "TOAN10",
    title: "Khảo Sát Hình Học & Hệ Thức Lượng lớp 10",
    subject: "Toán Học",
    grade: "10",
    description: "Đề kiểm tra ôn tập chương hệ thức lượng trong tam giác, có kèm hình vẽ minh họa chi tiết để rèn luyện tư duy không gian.",
    createdAt: "2026-05-25T08:00:00Z",
    questions: [
      {
        id: "q1_1",
        questionText: "Cho tam giác ABC có góc A = 60 độ, cạnh b = 8cm, cạnh c = 5cm. Tính độ dài cạnh a (BC) và diện tích tam giác S?",
        options: [
          "a = 7cm, S = 10√3 cm²",
          "a = 9cm, S = 15 cm²",
          "a = 7cm, S = 12√3 cm²",
          "a = 8cm, S = 10 cm²"
        ],
        correctIndex: 0,
        explanation: "Sử dụng định lý cosin: a² = b² + c² - 2bc.cos(A) = 8² + 5² - 2*8*5*cos(60°) = 64 + 25 - 40 = 49. Suy ra a = 7cm. Diện tích S = 1/2 * b * c * sin(A) = 1/2 * 8 * 5 * sin(60°) = 10√3 cm².",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop"
      },
      {
        id: "q1_2",
        questionText: "Trong các hệ thức sau cho tam giác ABC, hệ thức nào thể hiện đúng Định lý Sin?",
        options: [
          "a/sinA = b/sinB = c/sinC = 2R",
          "a/cosA = b/cosB = c/cosC = 2R",
          "sinA/a = sinB/b = sinC/c = R",
          "a/sinA = b/sinB = c/sinC = R"
        ],
        correctIndex: 0,
        explanation: "Theo định lý Sin trong tam giác: Các cạnh tỉ lệ thuận với sin của góc đối diện, hằng số tỉ lệ bằng đường kính đường tròn ngoại tiếp tam giác (2R).",
      }
    ]
  },
  {
    id: "q2",
    code: "VATLY9",
    title: "Ôn Tập Điện học & Định luật Ohm kì II",
    subject: "Vật Lý",
    grade: "9",
    description: "Đề kiểm tra tổng hợp kiến thức về định luật Ohm, mạch điện mắc nối tiếp, song song và công hao phí điện năng.",
    createdAt: "2026-05-26T09:15:00Z",
    questions: [
      {
        id: "q2_1",
        questionText: "Dựa vào sơ đồ mạch điện dưới đây, nếu chập ampe kế song song với điện trở R2 thì dòng điện qua R1 thay đổi thế nào?",
        options: [
          "Tăng lên vì tổng điện trở mạch giảm",
          "Giảm đi vì mạch bị hở",
          "Không thay đổi",
          "Triệt tiêu dòng qua cả mạch"
        ],
        correctIndex: 0,
        explanation: "Khi chập Ampe kế song song với R2, ampe kế có điện trở rất nhỏ (coi như bằng 0) sẽ làm ngắn mạch R2. Điện trở tương đương của mạch chỉ còn R1, nhỏ hơn ban đầu (R1 + R2). Theo định luật Ohm, I = U/Rtđ, do Rtđ giảm nên dòng điện mạch chính qua R1 tăng lên.",
        image: "https://images.unsplash.com/photo-1617155093730-a8bf47be792d?w=800&auto=format&fit=crop"
      },
      {
        id: "q2_2",
        questionText: "Đơn vị đo công suất điện là gì và bằng tích của những đại lượng nào?",
        options: [
          "Oát (W), bằng tích hiệu điện thế (V) và cường độ dòng điện (A)",
          "Ampe (A), bằng thương số V / Ohm",
          "Jun (J), bằng tích công suất với thời gian",
          "Vôn (V), bằng hiệu thế giữa hai cực điện"
        ],
        correctIndex: 0,
        explanation: "Công suất P = U.I được tính bằng đơn vị Oát (W). Một oát tương đương tích của hiệu điện thế 1 Vôn (V) và dòng điện 1 Ampe (A).",
      }
    ]
  },
  {
    id: "q3",
    code: "SINH8",
    title: "Khảo Sát Tế Bào Thần Kinh & Cấu Trúc Não",
    subject: "Sinh Học",
    grade: "8",
    description: "Câu hỏi trắc nghiệm kiểm tra cấu trúc noron thần kinh trung ương và các cơ chế phản xạ sinh học.",
    createdAt: "2026-05-27T14:30:00Z",
    questions: [
      {
        id: "q3_1",
        questionText: "Quan sát tế bào thần kinh (Nơ-ron) trong tiêu bản hình vẽ. Bộ phận nào chịu trách nhiệm truyền xung thần kinh đi từ thân nơ-ron ra ngoài?",
        options: [
          "Sợi trục (Axon)",
          "Sợi nhánh (Dendrite)",
          "Thân nơ-ron (Soma)",
          "Bao mi-ê-lin"
        ],
        correctIndex: 0,
        explanation: "Xung thần kinh được tiếp nhận bởi sợi nhánh, truyền vào thân nơ-ron và đi ra ngoài qua sợi trục độc nhất hướng tới tế bào đích.",
        image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&auto=format&fit=crop"
      }
    ]
  }
];

export const SAMPLE_SUBMISSIONS: StudentSubmission[] = [
  {
    id: "sub1",
    quizId: "q1",
    quizCode: "TOAN10",
    quizTitle: "Khảo Sát Hình Học & Hệ Thức Lượng lớp 10",
    studentName: "Nguyễn Văn Hùng",
    studentClass: "10A1",
    answers: {
      "q1_1": 0,
      "q1_2": 0
    },
    score: 10.0,
    correctCount: 2,
    totalCount: 2,
    submittedAt: "2026-05-29T02:30:00Z",
    durationSeconds: 145
  },
  {
    id: "sub2",
    quizId: "q1",
    quizCode: "TOAN10",
    quizTitle: "Khảo Sát Hình Học & Hệ Thức Lượng lớp 10",
    studentName: "Lê Thị Hồng",
    studentClass: "10A1",
    answers: {
      "q1_1": 2, // sai
      "q1_2": 0  // dung
    },
    score: 5.0,
    correctCount: 1,
    totalCount: 2,
    submittedAt: "2026-05-29T03:10:00Z",
    durationSeconds: 210
  },
  {
    id: "sub3",
    quizId: "q2",
    quizCode: "VATLY9",
    studentName: "Trần Minh Quang",
    studentClass: "9B",
    quizTitle: "Ôn Tập Điện học & Định luật Ohm kì II",
    answers: {
      "q2_1": 0,
      "q2_2": 2 // sai
    },
    score: 5.0,
    correctCount: 1,
    totalCount: 2,
    submittedAt: "2026-05-29T04:15:00Z",
    durationSeconds: 98
  },
  {
    id: "sub4",
    quizId: "q2",
    quizCode: "VATLY9",
    studentName: "Phạm Hà Giang",
    studentClass: "9A",
    quizTitle: "Ôn Tập Điện học & Định luật Ohm kì II",
    answers: {
      "q2_1": 0,
      "q2_2": 0
    },
    score: 10.0,
    correctCount: 2,
    totalCount: 2,
    submittedAt: "2026-05-29T05:00:00Z",
    durationSeconds: 180
  },
  {
    id: "sub5",
    quizId: "q3",
    quizCode: "SINH8",
    studentName: "Phạm Hà Giang",
    studentClass: "8A2",
    quizTitle: "Khảo Sát Tế Bào Thần Kinh & Cấu Trúc Não",
    answers: {
      "q3_1": 1 // sai
    },
    score: 0.0,
    correctCount: 0,
    totalCount: 1,
    submittedAt: "2026-05-29T06:40:00Z",
    durationSeconds: 52
  }
];
