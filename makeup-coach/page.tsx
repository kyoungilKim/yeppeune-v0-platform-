"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import AIMakeupCoach from "@/components/ai-makeup-coach"
import type { MakeupCoachSession } from "@/types/makeup-coach"
import { Brain, Target, Trophy, TrendingUp, Clock, Star } from "lucide-react"

export default function MakeupCoachPage() {
  const [selectedLook, setSelectedLook] = useState<string>("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner")
  const [showCoach, setShowCoach] = useState(false)
  const [completedSession, setCompletedSession] = useState<MakeupCoachSession | null>(null)

  // 임시 사용자 ID
  const userId = "user123"

  const makeupLooks = [
    {
      id: "natural-daily",
      name: "자연스러운 데일리",
      description: "일상에서 사용할 수 있는 자연스러운 메이크업",
      difficulty: "beginner",
      duration: "15-20분",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "office-professional",
      name: "오피스 프로페셔널",
      description: "직장에서 적합한 깔끔하고 세련된 메이크업",
      difficulty: "beginner",
      duration: "20-25분",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "evening-glam",
      name: "이브닝 글램",
      description: "저녁 모임이나 파티에 어울리는 화려한 메이크업",
      difficulty: "intermediate",
      duration: "30-40분",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "smoky-eyes",
      name: "스모키 아이",
      description: "매혹적인 스모키 아이 메이크업",
      difficulty: "intermediate",
      duration: "25-35분",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "korean-gradient",
      name: "한국식 그라데이션",
      description: "K-뷰티 스타일의 그라데이션 립과 자연스러운 메이크업",
      difficulty: "beginner",
      duration: "20-25분",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "editorial-creative",
      name: "에디토리얼 크리에이티브",
      description: "창의적이고 예술적인 메이크업",
      difficulty: "advanced",
      duration: "45-60분",
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  const difficultyInfo = {
    beginner: {
      label: "초급",
      description: "메이크업을 처음 배우는 분들을 위한 기초 과정",
      color: "bg-green-100 text-green-800",
      features: ["기본 기법 중심", "단계별 상세 가이드", "실수 허용적 피드백"],
    },
    intermediate: {
      label: "중급",
      description: "기본기를 익힌 분들을 위한 심화 과정",
      color: "bg-blue-100 text-blue-800",
      features: ["다양한 기법 활용", "정확도 중시", "창의적 표현 격려"],
    },
    advanced: {
      label: "고급",
      description: "전문가 수준의 고급 기법을 배우는 과정",
      color: "bg-purple-100 text-purple-800",
      features: ["복잡한 기법", "높은 정확도 요구", "예술적 완성도 추구"],
    },
  }

  const handleStartCoaching = (lookId: string) => {
    const look = makeupLooks.find((l) => l.id === lookId)
    if (look) {
      setSelectedLook(look.name)
      setSelectedDifficulty(look.difficulty as any)
      setShowCoach(true)
    }
  }

  const handleSessionComplete = (session: MakeupCoachSession) => {
    setCompletedSession(session)
    setShowCoach(false)
  }

  const handleBackToSelection = () => {
    setShowCoach(false)
    setCompletedSession(null)
    setSelectedLook("")
  }

  if (showCoach) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4">
          <Button variant="outline" onClick={handleBackToSelection} className="mb-4">
            ← 메이크업 선택으로 돌아가기
          </Button>

          <AIMakeupCoach
            userId={userId}
            targetLook={selectedLook}
            difficulty={selectedDifficulty}
            onSessionComplete={handleSessionComplete}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">AI 메이크업 코치</h1>
        <p className="text-xl text-gray-600 mb-6">실시간 피드백과 개선점 제안으로 완벽한 메이크업을 완성하세요</p>

        <div className="flex justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-pink-500" />
            <span>AI 실시간 분석</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>맞춤형 피드백</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span>실력 향상 추적</span>
          </div>
        </div>
      </div>

      {/* 완료된 세션 결과 */}
      {completedSession && (
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Trophy className="h-5 w-5" />
              세션 완료!
            </CardTitle>
            <CardDescription>축하합니다! {selectedLook} 메이크업을 성공적으로 완성했습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedSession.overallScore}점</div>
                <div className="text-sm text-gray-600">최종 점수</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {completedSession.endTime && completedSession.startTime
                    ? Math.round((completedSession.endTime.getTime() - completedSession.startTime.getTime()) / 60000)
                    : 0}
                  분
                </div>
                <div className="text-sm text-gray-600">소요 시간</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{completedSession.achievements.length}</div>
                <div className="text-sm text-gray-600">획득 업적</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {completedSession.feedback.filter((f) => f.severity === "success").length}
                </div>
                <div className="text-sm text-gray-600">성공 피드백</div>
              </div>
            </div>

            {completedSession.achievements.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">획득한 업적:</h4>
                <div className="flex flex-wrap gap-2">
                  {completedSession.achievements.map((achievement) => (
                    <Badge key={achievement.id} variant="outline" className="flex items-center gap-1">
                      <span>{achievement.icon}</span>
                      <span>{achievement.title}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 난이도 선택 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">난이도 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(difficultyInfo).map(([key, info]) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                selectedDifficulty === key ? "ring-2 ring-pink-500" : "hover:shadow-md"
              }`}
              onClick={() => setSelectedDifficulty(key as any)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{info.label}</span>
                  <Badge className={info.color}>{info.label}</Badge>
                </CardTitle>
                <CardDescription>{info.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {info.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 메이크업 룩 선택 */}
      <div>
        <h2 className="text-2xl font-bold mb-4">메이크업 룩 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {makeupLooks
            .filter(
              (look) =>
                selectedDifficulty === "beginner" ||
                look.difficulty === selectedDifficulty ||
                selectedDifficulty === "advanced",
            )
            .map((look) => (
              <Card key={look.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-100">
                  <img src={look.image || "/placeholder.svg"} alt={look.name} className="w-full h-full object-cover" />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{look.name}</CardTitle>
                    <Badge className={difficultyInfo[look.difficulty as keyof typeof difficultyInfo].color}>
                      {difficultyInfo[look.difficulty as keyof typeof difficultyInfo].label}
                    </Badge>
                  </div>
                  <CardDescription>{look.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{look.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">4.8</span>
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => handleStartCoaching(look.id)}>
                    코칭 시작하기
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* 기능 소개 */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-pink-500" />
              실시간 AI 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              고급 컴퓨터 비전 기술로 메이크업 상태를 실시간 분석하고 즉각적인 피드백을 제공합니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              맞춤형 가이드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              개인의 얼굴형, 피부톤, 실력 수준에 맞춘 맞춤형 메이크업 가이드를 제공합니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              실력 향상 추적
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">메이크업 실력의 향상 과정을 추적하고 개인화된 학습 경로를 제안합니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
