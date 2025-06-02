"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkincareRoutineDisplay } from "@/components/skincare-routine-display"
import { SkincareRoutineEngine } from "@/lib/skincare-routine-engine"
import type { SkincareRoutine, LifestyleFactors, RoutineProgress } from "@/types/skincare-routine"
import { Sparkles, Plus, Calendar, TrendingUp, Target, Clock, DollarSign, Zap, Loader2 } from "lucide-react"

export default function SkincareRoutinePage() {
  const [routines, setRoutines] = useState<SkincareRoutine[]>([])
  const [activeRoutine, setActiveRoutine] = useState<SkincareRoutine | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showLifestyleForm, setShowLifestyleForm] = useState(false)
  const [lifestyleFactors, setLifestyleFactors] = useState<LifestyleFactors>({
    activityLevel: "moderate",
    climate: "temperate",
    pollution: "moderate",
    stress: "moderate",
    sleep: "average",
    diet: "average",
    timeAvailable: "moderate",
    budget: "mid-range",
    skinSensitivity: "mild",
    currentProducts: [],
    allergies: [],
  })

  const userId = "user123" // 실제로는 인증 시스템에서 가져와야 함

  useEffect(() => {
    loadRoutines()
  }, [])

  const loadRoutines = async () => {
    try {
      setLoading(true)
      const userRoutines = await SkincareRoutineEngine.getUserRoutines(userId)
      setRoutines(userRoutines)

      const active = userRoutines.find((r) => r.isActive)
      if (active) {
        setActiveRoutine(active)
      }
    } catch (error) {
      console.error("Error loading routines:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateNewRoutine = async () => {
    try {
      setGenerating(true)
      const newRoutine = await SkincareRoutineEngine.generatePersonalizedRoutine(userId, lifestyleFactors)

      // 기존 활성 루틴 비활성화
      // 실제로는 Firestore 업데이트 필요

      setRoutines((prev) => [newRoutine, ...prev])
      setActiveRoutine(newRoutine)
      setShowLifestyleForm(false)
    } catch (error) {
      console.error("Error generating routine:", error)
    } finally {
      setGenerating(false)
    }
  }

  const handleProgressUpdate = (progress: RoutineProgress) => {
    // 진행상황 업데이트 처리
    console.log("Progress updated:", progress)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto mb-4" />
            <p className="text-gray-600">스킨케어 루틴을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 맞춤 스킨케어 루틴</h1>
        <p className="text-gray-600">피부 분석을 바탕으로 개인화된 스킨케어 루틴을 생성하고 관리하세요</p>
      </div>

      {activeRoutine ? (
        <Tabs defaultValue="routine" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="routine">현재 루틴</TabsTrigger>
            <TabsTrigger value="progress">진행 상황</TabsTrigger>
            <TabsTrigger value="history">루틴 히스토리</TabsTrigger>
          </TabsList>

          <TabsContent value="routine">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">현재 활성 루틴</h2>
                <Button onClick={() => setShowLifestyleForm(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />새 루틴 생성
                </Button>
              </div>

              <SkincareRoutineDisplay routine={activeRoutine} onUpdateProgress={handleProgressUpdate} />
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <ProgressTracking routine={activeRoutine} />
          </TabsContent>

          <TabsContent value="history">
            <RoutineHistory routines={routines} onSelectRoutine={setActiveRoutine} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-6">
          {/* 첫 루틴 생성 */}
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="h-16 w-16 text-pink-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">첫 번째 맞춤 루틴을 만들어보세요!</h2>
              <p className="text-gray-600 mb-6">
                피부 분석 결과와 라이프스타일을 바탕으로 개인화된 스킨케어 루틴을 생성합니다
              </p>
              <Button onClick={() => setShowLifestyleForm(true)} size="lg" disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    루틴 생성 중...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    AI 루틴 생성하기
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 기능 소개 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  개인 맞춤화
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  피부 타입, 고민사항, 라이프스타일을 종합 분석하여 최적화된 루틴을 제공합니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  단계별 가이드
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  아침/저녁 루틴부터 주간/월간 트리트먼트까지 상세한 단계별 가이드를 제공합니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  효과 추적
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">일일 피부 상태를 기록하고 루틴의 효과를 과학적으로 분석합니다.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 라이프스타일 설문 모달 */}
      {showLifestyleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>라이프스타일 정보</CardTitle>
              <CardDescription>더 정확한 맞춤 루틴을 위해 라이프스타일 정보를 입력해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>활동량</Label>
                  <Select
                    value={lifestyleFactors.activityLevel}
                    onValueChange={(value) => setLifestyleFactors((prev) => ({ ...prev, activityLevel: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음 (주로 실내)</SelectItem>
                      <SelectItem value="moderate">보통 (실내외 혼합)</SelectItem>
                      <SelectItem value="high">높음 (주로 야외)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>거주 환경</Label>
                  <Select
                    value={lifestyleFactors.climate}
                    onValueChange={(value) => setLifestyleFactors((prev) => ({ ...prev, climate: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="humid">습함</SelectItem>
                      <SelectItem value="dry">건조함</SelectItem>
                      <SelectItem value="temperate">온화함</SelectItem>
                      <SelectItem value="tropical">열대</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>스킨케어 시간</Label>
                  <Select
                    value={lifestyleFactors.timeAvailable}
                    onValueChange={(value) => setLifestyleFactors((prev) => ({ ...prev, timeAvailable: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">최소 (5-10분)</SelectItem>
                      <SelectItem value="moderate">보통 (10-20분)</SelectItem>
                      <SelectItem value="extensive">충분 (20분+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>예산</Label>
                  <Select
                    value={lifestyleFactors.budget}
                    onValueChange={(value) => setLifestyleFactors((prev) => ({ ...prev, budget: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">저가 (1-3만원)</SelectItem>
                      <SelectItem value="mid-range">중가 (3-10만원)</SelectItem>
                      <SelectItem value="high-end">고가 (10-30만원)</SelectItem>
                      <SelectItem value="luxury">럭셔리 (30만원+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>알레르기/피해야 할 성분 (쉼표로 구분)</Label>
                <Input
                  value={lifestyleFactors.allergies.join(", ")}
                  onChange={(e) =>
                    setLifestyleFactors((prev) => ({
                      ...prev,
                      allergies: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="예: 향료, 알코올, 파라벤"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowLifestyleForm(false)}>
                  취소
                </Button>
                <Button onClick={generateNewRoutine} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    "루틴 생성"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function ProgressTracking({ routine }: { routine: SkincareRoutine }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">진행 상황 추적</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">완주율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">지난 7일 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">피부 점수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.2/10</div>
            <p className="text-xs text-muted-foreground">+0.8 지난주 대비</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">루틴 기간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23일</div>
            <p className="text-xs text-muted-foreground">{routine.timeline} 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">개선된 고민</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2개</div>
            <p className="text-xs text-muted-foreground">총 {routine.primaryConcerns.length}개 중</p>
          </CardContent>
        </Card>
      </div>

      {/* 진행 차트 영역 */}
      <Card>
        <CardHeader>
          <CardTitle>피부 상태 변화</CardTitle>
          <CardDescription>시간에 따른 피부 상태 개선 추이</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>차트 컴포넌트 (실제로는 Chart.js나 Recharts 사용)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RoutineHistory({
  routines,
  onSelectRoutine,
}: {
  routines: SkincareRoutine[]
  onSelectRoutine: (routine: SkincareRoutine) => void
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">루틴 히스토리</h2>

      <div className="space-y-4">
        {routines.map((routine) => (
          <Card key={routine.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader onClick={() => onSelectRoutine(routine)}>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{routine.name}</CardTitle>
                  <CardDescription>{routine.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  {routine.isActive && <Badge>활성</Badge>}
                  <Badge variant="outline">{routine.skinType}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  {routine.timeline}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />₩{routine.totalCost.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  {routine.primaryConcerns.length}개 고민
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {new Date(routine.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
