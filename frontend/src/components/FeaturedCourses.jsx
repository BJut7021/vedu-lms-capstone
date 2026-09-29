import React from 'react';
import { Clock, BookOpen, Star, User } from 'lucide-react';

const COURSES = [
  {
    id: 1,
    title: 'Lập trình Web với React & Node.js toàn diện',
    instructor: 'TS. Nguyễn Văn A',
    lessons: 24,
    duration: '32 giờ',
    rating: 4.9,
    students: 1250,
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    title: 'Khai phá dữ liệu chuỗi hành vi với thuật toán AI',
    instructor: 'ThS. Trần Thị B',
    lessons: 18,
    duration: '26 giờ',
    rating: 4.8,
    students: 840,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 3,
    title: 'Cơ sở dữ liệu PostgreSQL và Tối ưu hóa truy vấn',
    instructor: 'ThS. Lê Hoàng C',
    lessons: 15,
    duration: '20 giờ',
    rating: 4.9,
    students: 920,
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80'
  }
];

export default function FeaturedCourses({ onSelectCourse }) {
  return (
    <section id="courses" className="py-16 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Khóa học nổi bật</h2>
            <p className="text-gray-500 text-sm mt-1">Bấm vào khóa học để xem đề cương và bắt đầu học</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {COURSES.map(course => (
            <div 
              key={course.id} 
              onClick={() => onSelectCourse && onSelectCourse(course)}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col cursor-pointer"
            >
              <img src={course.image} alt={course.title} className="w-full h-44 object-cover" />
              
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mb-2">
                    <Star size={14} fill="currentColor" />
                    <span>{course.rating}</span>
                    <span className="text-gray-400 font-normal">({course.students} học viên)</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base leading-snug hover:text-blue-600 transition line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <User size={14} />
                    <span>{course.instructor}</span>
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} /> {course.lessons} bài học
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {course.duration}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}