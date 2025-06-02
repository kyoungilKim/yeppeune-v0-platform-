export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          🌸 Yeppeune - AI 뷰티 플랫폼
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          개인 맞춤형 AI 뷰티 솔루션
        </p>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">🎯 주요 기능</h2>
            <ul className="text-left space-y-2">
              <li>✨ AI 얼굴 분석</li>
              <li>💄 맞춤형 뷰티 추천</li>
              <li>👥 뷰티 커뮤니티</li>
              <li>📱 AR 메이크업</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
