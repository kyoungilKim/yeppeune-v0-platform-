import type { Metadata } from "next"
import ARMakeupTutorial from "@/components/ar-makeup-tutorial"
import { MakeupTutorialService } from "@/lib/makeup-tutorial-service"

interface MakeupTutorialDetailPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: MakeupTutorialDetailPageProps): Promise<Metadata> {
  // 실제 구현에서는 서버에서 튜토리얼 정보를 가져옴
  const tutorial = await MakeupTutorialService.getTutorialById(params.id)

  return {
    title: tutorial ? `${tutorial.title} | Yeppeune` : "메이크업 튜토리얼 | Yeppeune",
    description: tutorial?.description || "AR을 활용한 단계별 메이크업 튜토리얼",
  }
}

export default function MakeupTutorialDetailPage({ params }: MakeupTutorialDetailPageProps) {
  // 실제 구현에서는 서버 컴포넌트에서 사용자 인증 정보를 가져옴
  // 여기서는 임시 사용자 ID 사용
  const userId = "current-user-id"

  return (
    <div className="py-6">
      <ARMakeupTutorial tutorialId={params.id} userId={userId} />
    </div>
  )
}
