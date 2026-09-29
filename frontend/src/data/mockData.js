export const MOCK_COURSE_DETAIL = {
  id: 1,
  title: 'Lập trình Web với React & Node.js toàn diện',
  description: 'Khóa học trang bị nền tảng full-stack hiện đại từ xây dựng giao diện tương tác với React đến kiến trúc Backend RESTful API và tối ưu cơ sở dữ liệu.',
  instructor: 'TS. Nguyễn Văn A',
  instructorTitle: 'Giảng viên Khoa CNTT - HUIT',
  rating: 4.9,
  students: 1250,
  updatedDate: 'Tháng 09/2026',
  duration: '32 giờ',
  sections: [
    {
      id: 'sec-1',
      title: 'Chương 1: Tổng quan và Thiết lập môi trường',
      lessons: [
        { id: 'lsn-1-1', title: '1.1 Giới thiệu kiến trúc hệ thống Vedu LMS', type: 'video', duration: '12:40', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', completed: true },
        { id: 'lsn-1-2', title: '1.2 Đọc tài liệu: Cấu trúc thư mục & Coding Convention', type: 'pdf', duration: '10 trang', completed: true },
        { id: 'lsn-1-3', title: '1.3 Quiz đánh giá đầu vào Chương 1', type: 'quiz', duration: '10 phút', completed: false }
      ]
    },
    {
      id: 'sec-2',
      title: 'Chương 2: React Core & Kiến trúc UI Component',
      lessons: [
        { id: 'lsn-2-1', title: '2.1 JSX, State và Props trong React hiện đại', type: 'video', duration: '18:25', videoUrl: 'https://www.w3schools.com/html/movie.mp4', completed: false },
        { id: 'lsn-2-2', title: '2.2 Xây dựng UI Event Hooks bắt tương tác người dùng', type: 'video', duration: '22:10', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', completed: false },
        { id: 'lsn-2-3', title: '2.3 Bài kiểm tra trắc nghiệm: Kiểm tra kiến thức React Hooks', type: 'quiz', duration: '15 phút', completed: false }
      ]
    }
  ]
};

export const MOCK_QUIZ_DATA = {
  id: 'quiz-react-01',
  title: 'Bài kiểm tra trắc nghiệm: Kiến thức cốt lõi React & UI Hooks',
  durationMinutes: 10,
  passingScore: 7.0,
  questions: [
    {
      id: 1,
      question: 'Trong kiến trúc thu thập dữ liệu của Vedu LMS, Event Hook nào được kích hoạt khi học viên xem đạt từ 85% thời lượng video bài giảng?',
      options: [
        'onLessonStart',
        'onVideoComplete',
        'onQuizSubmit',
        'onCourseView'
      ],
      correctAnswer: 1
    },
    {
      id: 2,
      question: 'Thuật toán khai phá chuỗi hành vi học tập nào được tích hợp trong hệ thống để gợi ý bài học kế tiếp?',
      options: [
        'K-Means Clustering',
        'PrefixSpan (Sequential Pattern Mining)',
        'Linear Regression',
        'Dijkstra Algorithm'
      ],
      correctAnswer: 1
    },
    {
      id: 3,
      question: 'Khi học viên bấm chọn một bài học trong widget "Lộ trình đề xuất tối ưu tiếp theo", giao diện sẽ kích hoạt Hook nào?',
      options: [
        'onRecommendationSelected',
        'onUserAuthenticated',
        'onCourseView',
        'onQuizSubmit'
      ],
      correctAnswer: 0
    }
  ]
};