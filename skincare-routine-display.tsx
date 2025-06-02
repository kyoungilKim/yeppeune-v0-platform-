"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import type { SkincareRoutine, SkincareStep, RoutineProgress } from "@/types/skincare-routine"
import { SkincareRoutineEngine } from "@/lib/skincare-routine-engine"
import {
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  Circle,
  Calendar,
  Droplets,
  Sun,
  Moon,
  Zap,
  Heart,
  AlertCircle,
  Info,
} from "lucide-react"

interface SkincareRoutineDisplayProps {
  routine: SkincareRoutine
  onUpdateProgress?: (progress: Omit<RoutineProgress, "id">) => void
}

export function SkincareRoutineDisplay({ routine, onUpdateProgress }: SkincareRoutineDisplayProps) {
  const [selectedTab, setSelectedTab] = useState("morning")
  const [todayProgress, setTodayProgress] = useState<{
    completedSteps: string[]
    skippedSteps: string[]
    notes: string
    skinCondition: {
      hydration: number
      oiliness: number
      irritation: number
      overall: number
    }
  }>({
    completedSteps: [],
    skippedSteps: [],
    notes: "",
    skinCondition: {
      hydration: 5,
      oiliness: 5,
      irritation: 3,
      overall: 6,
    },
  })

  const handleStepToggle = (stepId: string, completed: boolean) => {
    setTodayProgress((prev) => {
      const newCompleted = completed
        ? [...prev.completedSteps.filter((id) => id !== stepId), stepId]
        : prev.completedSteps.filter((id) => id !== stepId)

      const newSkipped = completed
        ? prev.skippedSteps.filter((id) => id !== stepId)
        : [...prev.skippedSteps.filter((id) => id !== stepId), stepId]

      return {
        ...prev,
        completedSteps: newCompleted,
        skippedSteps: newSkipped,
      }
    })
  }

  const saveProgress = async () => {
    if (onUpdateProgress) {
      const progress: Omit<RoutineProgress, "id"> = {
        userId: routine.userId,
        routineId: routine.id,
        date: new Date(),
        ...todayProgress,
      }

      try {
        await SkincareRoutineEngine.saveRoutineProgress(progress)
        onUpdateProgress(progress)
      } catch (error) {
        console.error("Error saving progress:", error)
      }
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500"
      case "intermediate":
        return "bg-yellow-500"
      case "advanced":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "초급"
      case "intermediate":
        return "중급"
      case "advanced":
        return "고급"
      default:
        return difficulty
    }
  }

  const getStepIcon = (category: string) => {
    switch (category) {
      case "cleanser":
        return <Droplets className="h-4 w-4" />
      case "toner":
        return <Circle className="h-4 w-4" />
      case "serum":
        return <Zap className="h-4 w-4" />
      case "moisturizer":
        return <Heart className="h-4 w-4" />
      case "sunscreen":
        return <Sun className="h-4 w-4" />
      case "treatment":
        return <Target className="h-4 w-4" />
      case "mask":
        return <Circle className="h-4 w-4" />
      case "exfoliant":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  const calculateCompletionRate = () => {
    const allSteps = [...routine.morningSteps, ...routine.eveningSteps]
    const totalSteps = allSteps.length
    const completedCount = todayProgress.completedSteps.length
    return totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0
  }

  return (
    <div className="space-y-6">
      {/* 루틴 개요 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{routine.name}</CardTitle>
              <CardDescription className="mt-2">{routine.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{routine.skinType}</Badge>
              <Badge className={getDifficultyColor(routine.difficulty)}>{getDifficultyLabel(routine.difficulty)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 진행률 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">오늘의 진행률</span>
              <span className="text-sm text-gray-600">{calculateCompletionRate()}%</span>
            </div>
            <Progress value={calculateCompletionRate()} className="h-2" />
          </div>

          {/* 주요 정보 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{routine.timeline}</div>
              <div className="text-sm text-gray-600">예상 기간</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₩{routine.totalCost.toLocaleString()}</div>
              <div className="text-sm text-gray-600">총 비용</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{routine.primaryConcerns.length}</div>
              <div className="text-sm text-gray-600">타겟 고민</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {routine.morningSteps.length + routine.eveningSteps.length}
              </div>
              <div className="text-sm text-gray-600">일일 단계</div>
            </div>
          </div>

          {/* 주요 고민사항 */}
          <div>
            <h4 className="font-medium mb-2">타겟 피부 고민</h4>
            <div className="flex flex-wrap gap-2">
              {routine.primaryConcerns.map((concern, index) => (
                <Badge key={index} variant="secondary">
                  {concern}
                </Badge>
              ))}
            </div>
          </div>

          {/* 목표 */}
          <div>
            <h4 className="font-medium mb-2">예상 효과</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {routine.expectedResults.map((result, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {result}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 루틴 단계별 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            일일 스킨케어 루틴
          </CardTitle>
          <CardDescription>각 단계를 체크하여 오늘의 루틴을 완료해보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="morning" className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                아침
              </TabsTrigger>
              <TabsTrigger value="evening" className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                저녁
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                주간
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                월간
              </TabsTrigger>
            </TabsList>

            <TabsContent value="morning" className="space-y-4 mt-6">
              <RoutineStepsList
                steps={routine.morningSteps}
                completedSteps={todayProgress.completedSteps}
                onStepToggle={handleStepToggle}
                getStepIcon={getStepIcon}
              />
            </TabsContent>

            <TabsContent value="evening" className="space-y-4 mt-6">
              <RoutineStepsList
                steps={routine.eveningSteps}
                completedSteps={todayProgress.completedSteps}
                onStepToggle={handleStepToggle}
                getStepIcon={getStepIcon}
              />
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4 mt-6">
              <RoutineStepsList
                steps={routine.weeklyTreatments}
                completedSteps={todayProgress.completedSteps}
                onStepToggle={handleStepToggle}
                getStepIcon={getStepIcon}
                isWeekly={true}
              />
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4 mt-6">
              <RoutineStepsList
                steps={routine.monthlyTreatments}
                completedSteps={todayProgress.completedSteps}
                onStepToggle={handleStepToggle}
                getStepIcon={getStepIcon}
                isMonthly={true}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 오늘의 피부 상태 기록 */}
      <Card>
        <CardHeader>
          <CardTitle>오늘의 피부 상태</CardTitle>
          <CardDescription>피부 상태를 기록하여 루틴의 효과를 추적해보세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">수분도 (1-10)</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={todayProgress.skinCondition.hydration}
                  onChange={(e) =>
                    setTodayProgress((prev) => ({
                      ...prev,
                      skinCondition: {
                        ...prev.skinCondition,
                        hydration: Number.parseInt(e.target.value),
                      },
                    }))
                  }
                  className="flex-1"
                />
                <span className="text-sm w-8">{todayProgress.skinCondition.hydration}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">유분감 (1-10)</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={todayProgress.skinCondition.oiliness}
                  onChange={(e) =>
                    setTodayProgress((prev) => ({
                      ...prev,
                      skinCondition: {
                        ...prev.skinCondition,
                        oiliness: Number.parseInt(e.target.value),
                      },
                    }))
                  }
                  className="flex-1"
                />
                <span className="text-sm w-8">{todayProgress.skinCondition.oiliness}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">자극감 (1-10)</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={todayProgress.skinCondition.irritation}
                  onChange={(e) =>
                    setTodayProgress((prev) => ({
                      ...prev,
                      skinCondition: {
                        ...prev.skinCondition,
                        irritation: Number.parseInt(e.target.value),
                      },
                    }))
                  }
                  className="flex-1"
                />
                <span className="text-sm w-8">{todayProgress.skinCondition.irritation}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">전반적 상태 (1-10)</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={todayProgress.skinCondition.overall}
                  onChange={(e) =>
                    setTodayProgress((prev) => ({
                      ...prev,
                      skinCondition: {
                        ...prev.skinCondition,
                        overall: Number.parseInt(e.target.value),
                      },
                    }))
                  }
                  className="flex-1"
                />
                <span className="text-sm w-8">{todayProgress.skinCondition.overall}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">메모</label>
            <Textarea
              placeholder="오늘 피부 상태나 루틴에 대한 소감을 기록해보세요..."
              value={todayProgress.notes}
              onChange={(e) =>
                setTodayProgress((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              className="mt-1"
            />
          </div>

          <Button onClick={saveProgress} className="w-full">
            <CheckCircle className="h-4 w-4 mr-2" />
            오늘의 진행상황 저장
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

interface RoutineStepsListProps {
  steps: SkincareStep[]
  completedSteps: string[]
  onStepToggle: (stepId: string, completed: boolean) => void
  getStepIcon: (category: string) => React.ReactNode
  isWeekly?: boolean
  isMonthly?: boolean
}

function RoutineStepsList({
  steps,
  completedSteps,
  onStepToggle,
  getStepIcon,
  isWeekly = false,
  isMonthly = false,
}: RoutineStepsListProps) {
  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Info className="h-8 w-8 mx-auto mb-2" />
        <p>{isWeekly ? "주간" : isMonthly ? "월간" : ""} 트리트먼트가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id)
        const product = step.products[0]

        return (
          <Card key={step.id} className={`transition-all ${isCompleted ? "bg-green-50 border-green-200" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={(checked) => onStepToggle(step.id, checked as boolean)}
                  />
                  <div className="flex items-center gap-2">
                    {getStepIcon(step.category)}
                    <span className="font-medium">
                      {step.order}. {step.name}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>

                  {product && (
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={product.imageUrl || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div>
                        <p className="font-medium text-sm">
                          {product.brand} {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₩{product.price.toLocaleString()} / {product.volume}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {step.duration}분
                    </span>
                    <span>
                      {step.frequency === "daily" ? "매일" : step.frequency === "weekly" ? "주 1-2회" : "월 1회"}
                    </span>
                  </div>

                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">사용법 보기</summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                      <p className="mb-2">{step.instructions}</p>
                      {product && <p className="text-xs text-gray-600">{product.howToUse}</p>}
                    </div>
                  </details>

                  {step.benefits && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {step.benefits.map((benefit, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {step.warnings && (
                    <div className="mt-2 flex items-start gap-2 p-2 bg-yellow-50 rounded">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-xs text-yellow-800">
                        {step.warnings.map((warning, idx) => (
                          <p key={idx}>• {warning}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
