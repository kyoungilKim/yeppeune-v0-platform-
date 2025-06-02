"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { MakeupCoachService } from "@/lib/makeup-coach-service"
import type { MakeupCoachSession, CoachFeedback, CoachSettings } from "@/types/makeup-coach"
import { Camera, Settings, Trophy, TrendingUp, AlertTriangle, CheckCircle, Info, Play, RotateCcw } from "lucide-react"

interface AIMakeupCoachProps {
  userId: string
  targetLook?: string
  difficulty?: "beginner" | "intermediate" | "advanced"
  onSessionComplete?: (session: MakeupCoachSession) => void
}

export default function AIMakeupCoach({
  userId,
  targetLook = "자연스러운 데일리 메이크업",
  difficulty = "beginner",
  onSessionComplete,
}: AIMakeupCoachProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [session, setSession] = useState<MakeupCoachSession | null>(null)
  const [feedbacks, setFeedbacks] = useState<CoachFeedback[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [settings, setSettings] = useState<CoachSettings>({
    voiceEnabled: true,
    voiceLanguage: "ko",
    feedbackFrequency: "normal",
    encouragementLevel: "medium",
    criticalFeedback: true,
    realTimeCorrection: true,
    pauseOnMistakes: false,
    showConfidenceScores: false,
  })
  const [currentScore, setCurrentScore] = useState(0)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  const coachService = MakeupCoachService.getInstance()

  // 타이머 설정
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isSessionActive && session) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isSessionActive, session])

  // 설정 업데이트
  useEffect(() => {
    coachService.updateSettings(settings)
  }, [settings])

  // 웹캠 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
        startAnalysisLoop()
      }
    } catch (error) {
      console.error("카메라 접근 오류:", error)
      alert("카메라에 접근할 수 없습니다. 권한을 확인해주세요.")
    }
  }

  // 웹캠 중지
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsStreaming(false)
      setIsAnalyzing(false)
    }
  }

  // 코칭 세션 시작
  const startSession = async () => {
    try {
      const newSession = await coachService.startCoachingSession(userId, targetLook, difficulty)
      setSession(newSession)
      setIsSessionActive(true)
      setElapsedTime(0)
      setFeedbacks([])
      setCurrentScore(0)
    } catch (error) {
      console.error("세션 시작 오류:", error)
      alert("세션을 시작할 수 없습니다.")
    }
  }

  // 분석 루프 시작
  const startAnalysisLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const analyzeFrame = async () => {
      if (!isStreaming || !session || !videoRef.current || !canvasRef.current) return

      try {
        setIsAnalyzing(true)

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        if (!ctx || video.videoWidth === 0) return

        // 캔버스 크기 설정
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // 비디오 프레임을 캔버스에 그리기
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // 이미지 데이터 추출
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // AI 분석 및 피드백
        const newFeedbacks = await coachService.analyzeAndProvideFeedback(imageData)

        if (newFeedbacks.length > 0) {
          setFeedbacks((prev) => [...prev, ...newFeedbacks].slice(-10)) // 최근 10개만 유지

          // 점수 업데이트
          const latestScore = calculateCurrentScore(newFeedbacks)
          setCurrentScore(latestScore)
        }

        // 시각적 가이드 그리기
        drawVisualGuides(ctx, newFeedbacks)
      } catch (error) {
        console.error("프레임 분석 오류:", error)
      } finally {
        setIsAnalyzing(false)
      }
    }

    // 분석 주기 설정 (설정에 따라 조정)
    const interval =
      settings.feedbackFrequency === "minimal" ? 3000 : settings.feedbackFrequency === "detailed" ? 1000 : 2000

    const analysisInterval = setInterval(analyzeFrame, interval)

    return () => clearInterval(analysisInterval)
  }, [isStreaming, session, settings.feedbackFrequency])

  // 시각적 가이드 그리기
  const drawVisualGuides = (ctx: CanvasRenderingContext2D, feedbacks: CoachFeedback[]) => {
    feedbacks.forEach((feedback) => {
      if (!feedback.visualGuide) return

      const { type, position, size, color, animation } = feedback.visualGuide

      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = 3

      const x = (position.x / 100) * ctx.canvas.width
      const y = (position.y / 100) * ctx.canvas.height

      switch (type) {
        case "circle":
          ctx.beginPath()
          ctx.arc(x, y, size, 0, 2 * Math.PI)
          ctx.stroke()
          break

        case "arrow":
          drawArrow(ctx, x, y, size, color)
          break

        case "highlight":
          ctx.fillStyle = `${color}33` // 투명도 추가
          ctx.fillRect(x - size / 2, y - size / 2, size, size)
          break

        case "overlay":
          ctx.fillStyle = `${color}22`
          ctx.fillRect(0, y - size / 2, ctx.canvas.width, size)
          break
      }

      ctx.restore()
    })
  }

  // 화살표 그리기 헬퍼
  const drawArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.beginPath()
    ctx.moveTo(x, y - size)
    ctx.lineTo(x, y + size)
    ctx.moveTo(x - size / 2, y + size / 2)
    ctx.lineTo(x, y + size)
    ctx.lineTo(x + size / 2, y + size / 2)
    ctx.stroke()
  }

  // 현재 점수 계산
  const calculateCurrentScore = (recentFeedbacks: CoachFeedback[]): number => {
    if (recentFeedbacks.length === 0) return currentScore

    const successCount = recentFeedbacks.filter((f) => f.severity === "success").length
    const warningCount = recentFeedbacks.filter((f) => f.severity === "warning").length
    const errorCount = recentFeedbacks.filter((f) => f.severity === "error").length

    const scoreChange = successCount * 5 - warningCount * 2 - errorCount * 5
    return Math.max(0, Math.min(100, currentScore + scoreChange))
  }

  // 다음 단계로 진행
  const proceedToNextStep = async () => {
    if (!session) return

    const success = await coachService.proceedToNextStep()
    if (success) {
      setSession((prev) => (prev ? { ...prev, currentStep: prev.currentStep + 1 } : null))
    }
  }

  // 세션 완료
  const completeSession = async () => {
    if (!session) return

    try {
      const completedSession = await coachService.completeSession()
      setSession(completedSession)
      setIsSessionActive(false)
      onSessionComplete?.(completedSession)
    } catch (error) {
      console.error("세션 완료 오류:", error)
    }
  }

  // 세션 재시작
  const restartSession = () => {
    setSession(null)
    setIsSessionActive(false)
    setFeedbacks([])
    setCurrentScore(0)
    setElapsedTime(0)
  }

  // 피드백 아이콘 반환
  const getFeedbackIcon = (severity: CoachFeedback["severity"]) => {
    switch (severity) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI 메이크업 코치</h1>
            <p className="text-gray-600">실시간 피드백으로 완벽한 메이크업을 완성하세요</p>
          </div>

          <div className="flex items-center gap-4">
            {session && (
              <div className="text-right">
                <div className="text-2xl font-bold text-pink-600">{currentScore}점</div>
                <div className="text-sm text-gray-500">{formatTime(elapsedTime)}</div>
              </div>
            )}

            <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 진행 상황 */}
        {session && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {session.currentStep + 1} / {session.totalSteps} 단계
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(((session.currentStep + 1) / session.totalSteps) * 100)}% 완료
              </span>
            </div>
            <Progress value={((session.currentStep + 1) / session.totalSteps) * 100} className="h-2" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 메인 카메라 영역 */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                실시간 AI 코칭
                {isAnalyzing && (
                  <Badge variant="outline" className="ml-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
                    분석 중
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
                {isStreaming ? (
                  <div className="relative">
                    <video ref={videoRef} autoPlay playsInline muted className="hidden" />
                    <canvas ref={canvasRef} className="w-full h-auto" style={{ transform: "scaleX(-1)" }} />

                    {/* 실시간 점수 오버레이 */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
                        <div className="text-lg font-bold">{currentScore}점</div>
                        <div className="text-xs">현재 점수</div>
                      </div>
                    </div>

                    {/* 실시간 피드백 오버레이 */}
                    {feedbacks.length > 0 && (
                      <div className="absolute top-4 right-4 max-w-xs">
                        <div className="bg-black bg-opacity-70 text-white p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            {getFeedbackIcon(feedbacks[feedbacks.length - 1].severity)}
                            <span className="text-sm font-medium">{feedbacks[feedbacks.length - 1].message}</span>
                          </div>
                          <p className="text-xs text-gray-300">{feedbacks[feedbacks.length - 1].suggestion}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">카메라를 시작하여 AI 코칭을 받아보세요</p>
                      <Button onClick={startCamera}>
                        <Camera className="h-4 w-4 mr-2" />
                        카메라 시작
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* 컨트롤 버튼 */}
              <div className="flex gap-2 justify-center">
                {!session ? (
                  <Button onClick={startSession} disabled={!isStreaming}>
                    <Play className="h-4 w-4 mr-2" />
                    코칭 시작
                  </Button>
                ) : isSessionActive ? (
                  <>
                    <Button onClick={proceedToNextStep}>다음 단계</Button>
                    <Button variant="outline" onClick={completeSession}>
                      완료
                    </Button>
                    <Button variant="outline" onClick={restartSession}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      재시작
                    </Button>
                  </>
                ) : (
                  <Button onClick={restartSession}>새 세션 시작</Button>
                )}

                {isStreaming && (
                  <Button variant="outline" onClick={stopCamera}>
                    카메라 중지
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 설정 패널 */}
          {showSettings && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">코치 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">음성 피드백</label>
                  <Switch
                    checked={settings.voiceEnabled}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, voiceEnabled: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">피드백 빈도</label>
                  <select
                    value={settings.feedbackFrequency}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        feedbackFrequency: e.target.value as any,
                      }))
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="minimal">최소</option>
                    <option value="normal">보통</option>
                    <option value="detailed">상세</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">격려 수준</label>
                  <select
                    value={settings.encouragementLevel}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        encouragementLevel: e.target.value as any,
                      }))
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">실시간 교정</label>
                  <Switch
                    checked={settings.realTimeCorrection}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, realTimeCorrection: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">신뢰도 점수 표시</label>
                  <Switch
                    checked={settings.showConfidenceScores}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, showConfidenceScores: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 실시간 피드백 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                실시간 피드백
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {feedbacks.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">아직 피드백이 없습니다</p>
                ) : (
                  feedbacks
                    .slice(-5)
                    .reverse()
                    .map((feedback) => (
                      <div
                        key={feedback.id}
                        className={`p-3 rounded-lg border-l-4 ${
                          feedback.severity === "success"
                            ? "border-green-500 bg-green-50"
                            : feedback.severity === "warning"
                              ? "border-yellow-500 bg-yellow-50"
                              : feedback.severity === "error"
                                ? "border-red-500 bg-red-50"
                                : "border-blue-500 bg-blue-50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {getFeedbackIcon(feedback.severity)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{feedback.message}</p>
                            <p className="text-xs text-gray-600 mt-1">{feedback.suggestion}</p>
                            {settings.showConfidenceScores && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                신뢰도: {feedback.confidence}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 성과 요약 */}
          {session && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  성과 요약
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">현재 점수</span>
                    <span className="font-bold text-lg">{currentScore}점</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">소요 시간</span>
                    <span className="font-medium">{formatTime(elapsedTime)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">완료 단계</span>
                    <span className="font-medium">
                      {session.currentStep + 1} / {session.totalSteps}
                    </span>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600 mb-2">피드백 통계</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-green-600 font-bold">
                          {feedbacks.filter((f) => f.severity === "success").length}
                        </div>
                        <div>성공</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-600 font-bold">
                          {feedbacks.filter((f) => f.severity === "warning").length}
                        </div>
                        <div>주의</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-600 font-bold">
                          {feedbacks.filter((f) => f.severity === "error").length}
                        </div>
                        <div>오류</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
