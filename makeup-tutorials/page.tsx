import type { Metadata } from "next"
import MakeupTutorialList from "@/components/makeup-tutorial-list"

export const metadata: Metadata = {
  title: "메이크업 튜토리얼 | Yeppeune",
  description: "AR을 활용한 단계별 메이크업 튜토리얼로 전문가 수준의 메이크업 기술을 배워보세요.",
}

export default function MakeupTutorialsPage() {
  // 실제 구현에서는 서버 컴포넌트에서 사용자 인증 정보를 가져옴
  // 여기서는 임시 사용자 ID 사용
  const userId = "current-user-id"

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">AR 메이크업 튜토리얼</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          증강현실(AR)을 활용한 단계별 메이크업 가이드로 전문가 수준의 메이크업 기술을 쉽게 배워보세요. 실시간으로
          얼굴에 적용되는 필터와 상세한 설명으로 완벽한 메이크업을 완성할 수 있습니다.
        </p>
      </div>

      <MakeupTutorialList userId={userId} />
    </div>
  )
}
