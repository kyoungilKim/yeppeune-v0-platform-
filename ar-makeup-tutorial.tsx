"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MakeupTutorialService } from "@/lib/makeup-tutorial-service"
import { Face3DTracker } from "@/lib/face-3d-tracker"
import type { MakeupTutorial, TutorialStep, ARFilter } from "@/types/makeup-tutorial"
import { Camera, CheckCircle, ChevronLeft, ChevronRight, Clock, Info, Star } from "lucide-react"

interface ARMakeupTutorialProps {
  tutorialId: string
  userId: string
  onComplete?: () => void
}

export default function ARMakeupTutorial({ tutorialId, userId, onComplete }: ARMakeupTutorialProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [tutorial, setTutorial] = useState<MakeupTutorial | null>(null)
  const [steps, setSteps] = useState<TutorialStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [arFilters, setArFilters] = useState<ARFilter[]>([])
  const [activeFilter, setActiveFilter] = useState<ARFilter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterApplied, setIsFilterApplied] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [activeTab, setActiveTab] = useState<"video" | "photo">("video")
  const [faceDetected, setFaceDetected] = useState(false)

  // 튜토리얼 데이터 로드
  useEffect(() => {
    const loadTutorialData = async () => {
      setIsLoading(true)
      try {
        // 튜토리얼 정보 로드
        const tutorialData = await MakeupTutorialService.getTutorialById(tutorialId)
        if (tutorialData) {
          setTutorial(tutorialData)
        }

        // 튜토리얼 단계 로드
        const stepsData = await MakeupTutorialService.getTutorialSteps(tutorialId)
        setSteps(stepsData)

        // AR 필터 로드
        const filtersData = await MakeupTutorialService.getARFilters()
        setArFilters(filtersData)
      } catch (error) {
        console.error("Error loading tutorial data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTutorialData()
  }, [tutorialId])

  // 현재 단계 필터 설정
  useEffect(() => {
    if (steps.length > 0 && currentStepIndex < steps.length) {
      const currentStep = steps[currentStepIndex]
      if (currentStep.arFilterId) {
        const filter = arFilters.find((f) => f.id === currentStep.arFilterId) || null
        setActiveFilter(filter)
        setIsFilterApplied(false)
      } else {
        setActiveFilter(null)
      }
    }
  }, [currentStepIndex, steps, arFilters])

  // 타이머 설정
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isStreaming && !isCompleted) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isStreaming, isCompleted])

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
        startFaceTracking()
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
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
      setFaceDetected(false)
    }
  }

  // 얼굴 추적 시작
  const startFaceTracking = () => {
    if (!videoRef.current || !canvasRef.current) return

    const tracker = Face3DTracker.getInstance()
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // 캔버스 크기 설정
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const trackFace = async () => {
      if (!video.paused && !video.ended && video.readyState > 1) {
        try {
          // 비디오 프레임을 캔버스에 그리기
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          // 얼굴 추적
          const tracking = await tracker.detectFace3D(video)

          if (tracking.isTracking) {
            setFaceDetected(true)

            // AR 필터 적용
            if (activeFilter && isFilterApplied) {
              applyARFilter(ctx, tracking.landmarks, activeFilter)
            }
          } else {
            setFaceDetected(false)
          }
        } catch (error) {
          console.error("Face tracking error:", error)
        }
      }

      requestAnimationFrame(trackFace)
    }

    trackFace()
  }

  // AR 필터 적용
  const applyARFilter = (ctx: CanvasRenderingContext2D, landmarks: any, filter: ARFilter) => {
    // 실제 구현에서는 여기서 필터 유형에 따라 다른 효과 적용
    // 간단한 구현을 위해 필터 카테고리별 기본 효과만 적용

    switch (filter.category) {
      case "foundation":
        // 파운데이션 효과 (피부 톤 균일화)
        applySkinFilter(ctx, landmarks, filter.parameters)
        break
      case "concealer":
        // 컨실러 효과 (특정 부위 밝기 조정)
        applyBrightnessFilter(ctx, landmarks, filter.parameters)
        break
      case "eyeshadow":
        // 아이섀도우 효과
        applyEyeshadowFilter(ctx, landmarks, filter.parameters)
        break
      case "mascara":
        // 마스카라 효과
        applyMascaraFilter(ctx, landmarks, filter.parameters)
        break
      case "blush":
        // 블러셔 효과
        applyBlushFilter(ctx, landmarks, filter.parameters)
        break
      case "lipstick":
        // 립스틱 효과
        applyLipstickFilter(ctx, landmarks, filter.parameters)
        break
    }
  }

  // 피부 필터 (파운데이션)
  const applySkinFilter = (ctx: CanvasRenderingContext2D, landmarks: any, parameters: any) => {
    // 실제 구현에서는 피부 영역 감지 후 블러 및 톤 조정
    // 간단한 시뮬레이션을 위해 전체 이미지에 약한 필터 적용

    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    const data = imageData.data

    // 간단한 스무딩 및 톤 조정
    for (let i = 0; i < data.length; i += 4) {
      // 피부톤 감지 및 조정 (실제로는 더 복잡한 알고리즘 필요)
      if (isSkinTone(data[i], data[i + 1], data[i + 2])) {
        // 커버리지에 따른 보정 강도 조정
        const intensity = parameters.coverage === "light" ? 0.2 : parameters.coverage === "medium" ? 0.4 : 0.6

        // 피부톤 균일화
        data[i] = data[i] * (1 - intensity) + 220 * intensity // R
        data[i + 1] = data[i + 1] * (1 - intensity) + 190 * intensity // G
        data[i + 2] = data[i + 2] * (1 - intensity) + 170 * intensity // B
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  // 밝기 필터 (컨실러)
  const applyBrightnessFilter = (ctx: CanvasRenderingContext2D, landmarks: any, parameters: any) => {
    // 실제 구현에서는 다크서클 영역 감지 후 밝기 조정
    // 간단한 시뮬레이션을 위해 눈 아래 영역에 밝기 필터 적용

    if (!landmarks || !landmarks.eyes) return

    const { leftEye, rightEye } = landmarks.eyes

    if (!leftEye || !rightEye) return

    // 눈 아래 영역 계산
    const leftUndereye = {
      x: leftEye.center.x,
      y: leftEye.center.y + leftEye.height,
      width: leftEye.width * 1.2,
      height: leftEye.height * 0.8,
    }

    const rightUndereye = {
      x: rightEye.center.x,
      y: rightEye.center.y + rightEye.height,
      width: rightEye.width * 1.2,
      height: rightEye.height * 0.8,
    }

    // 왼쪽 눈 아래 밝기 조정
    brightArea(ctx, leftUndereye, parameters.brightness || 0.2)

    // 오른쪽 눈 아래 밝기 조정
    brightArea(ctx, rightUndereye, parameters.brightness || 0.2)
  }

  // 아이섀도우 필터
  const applyEyeshadowFilter = (ctx: CanvasRenderingContext2D, landmarks: any, parameters: any) => {
    if (!landmarks || !landmarks.eyes) return

    const { leftEye, rightEye } = landmarks.eyes

    if (!leftEye || !rightEye) return

    // 아이섀도우 색상
    const colors = parameters.colors || ["#F5D5C0", "#C8A18E", "#8D5B4C"]
    const intensity = parameters.intensity || 0.7

    // 왼쪽 눈 아이섀도우
    applyEyeshadowToEye(ctx, leftEye, colors, intensity)

    // 오른쪽 눈 아이섀도우
    applyEyeshadowToEye(ctx, rightEye, colors, intensity)
  }

  // 마스카라 필터
  const applyMascaraFilter = (ctx: CanvasRenderingContext2D, landmarks: any, parameters: any) => {
    if (!landmarks || !landmarks.eyes) return

    const { leftEye, rightEye } = landmarks.eyes

    if (!leftEye || !leftEye.lashes || !rightEye || !rightEye.lashes) return

    const volume = parameters.volume || 0.6
    const length = parameters.length || 0.7

    // 속눈썹 강조
    enhanceLashes(ctx, leftEye.lashes, volume, length)
    enhanceLashes(ctx, rightEye.lashes, volume, length)
  }

  // 블러셔 필터
  const applyBlushFilter = (ctx: CanvasRenderingContext2D, landmarks: any, parameters: any) => {
    if (!landmarks || !landmarks.cheeks) return

    const { leftCheek, rightCheek } = landmarks.cheeks

    if (!leftCheek || !rightCheek) return

    const color = parameters.color || "#FF6B6B"
    const intensity = parameters.intensity || 0.4

    // 볼 부위에 블러셔 적용
    applyColorToArea(ctx, leftCheek, color, intensity)
    applyColorToArea(ctx, rightCheek, color, intensity)
  }

  // 립스틱 필터
  const applyLipstickFilter = (ctx: CanvasRenderingContext2D, landmarks: any, parameters: any) => {
    if (!landmarks || !landmarks.lips) return

    const lips = landmarks.lips

    if (!lips) return

    const color = parameters.color || "#CC6666"
    const opacity = parameters.opacity || 0.7
    const gradient = parameters.gradient || true

    // 입술에 립스틱 적용
    if (gradient) {
      applyGradientLipstick(ctx, lips, color, opacity)
    } else {
      applyColorToArea(ctx, lips, color, opacity)
    }
  }

  // 영역 밝게 만들기 (컨실러용)
  const brightArea = (
    ctx: CanvasRenderingContext2D,
    area: { x: number; y: number; width: number; height: number },
    amount: number,
  ) => {
    const { x, y, width, height } = area
    const imageData = ctx.getImageData(x, y, width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + data[i] * amount) // R
      data[i + 1] = Math.min(255, data[i + 1] + data[i + 1] * amount) // G
      data[i + 2] = Math.min(255, data[i + 2] + data[i + 2] * amount) // B
    }

    ctx.putImageData(imageData, x, y)
  }

  // 눈에 아이섀도우 적용
  const applyEyeshadowToEye = (ctx: CanvasRenderingContext2D, eye: any, colors: string[], intensity: number) => {
    // 실제 구현에서는 눈 주변 영역을 정확히 계산하여 그라데이션 적용
    // 간단한 시뮬레이션을 위해 눈 위쪽 영역에 색상 적용

    const eyeshadowArea = {
      x: eye.center.x - eye.width * 0.7,
      y: eye.center.y - eye.height * 1.5,
      width: eye.width * 1.4,
      height: eye.height,
    }

    // 가장 어두운 색상 (보통 가장 마지막 색상)
    const darkColor = colors[colors.length - 1]

    // 아이섀도우 적용
    applyColorToArea(ctx, eyeshadowArea, darkColor, intensity * 0.7)
  }

  // 속눈썹 강조
  const enhanceLashes = (ctx: CanvasRenderingContext2D, lashes: any, volume: number, length: number) => {
    // 실제 구현에서는 속눈썹 위치를 정확히 감지하여 강조
    // 간단한 시뮬레이션을 위해 속눈썹 영역을 어둡게 하고 길게 표현

    // 속눈썹 영역 계산 (간단한 예시)
    const lashArea = {
      x: lashes.x,
      y: lashes.y,
      width: lashes.width,
      height: lashes.height * (1 + length * 0.5),
    }

    // 속눈썹 강조
    ctx.fillStyle = `rgba(0, 0, 0, ${volume * 0.8})`
    ctx.fillRect(lashArea.x, lashArea.y, lashArea.width, lashArea.height)
  }

  // 영역에 색상 적용
  const applyColorToArea = (ctx: CanvasRenderingContext2D, area: any, color: string, intensity: number) => {
    const { x, y, width, height } = area
    const imageData = ctx.getImageData(x, y, width, height)
    const data = imageData.data

    // 색상 변환
    const r = Number.parseInt(color.slice(1, 3), 16)
    const g = Number.parseInt(color.slice(3, 5), 16)
    const b = Number.parseInt(color.slice(5, 7), 16)

    for (let i = 0; i < data.length; i += 4) {
      // 색상 블렌딩
      data[i] = data[i] * (1 - intensity) + r * intensity // R
      data[i + 1] = data[i + 1] * (1 - intensity) + g * intensity // G
      data[i + 2] = data[i + 2] * (1 - intensity) + b * intensity // B
    }

    ctx.putImageData(imageData, x, y)
  }

  // 그라데이션 립스틱 적용
  const applyGradientLipstick = (ctx: CanvasRenderingContext2D, lips: any, color: string, opacity: number) => {
    const { x, y, width, height, center } = lips
    const imageData = ctx.getImageData(x, y, width, height)
    const data = imageData.data

    // 색상 변환
    const r = Number.parseInt(color.slice(1, 3), 16)
    const g = Number.parseInt(color.slice(3, 5), 16)
    const b = Number.parseInt(color.slice(5, 7), 16)

    // 입술 중앙에서의 거리에 따라 그라데이션 적용
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const idx = (py * width + px) * 4

        // 픽셀 위치
        const pixelX = x + px
        const pixelY = y + py

        // 중앙에서의 거리 계산
        const distFromCenter = Math.sqrt(Math.pow(pixelX - center.x, 2) + Math.pow(pixelY - center.y, 2))

        // 거리에 따른 강도 조정 (중앙이 더 진하게)
        const distRatio = Math.min(distFromCenter / (width / 2), 1)
        const gradientOpacity = opacity * (1 - distRatio * 0.7)

        // 색상 블렌딩
        data[idx] = data[idx] * (1 - gradientOpacity) + r * gradientOpacity // R
        data[idx + 1] = data[idx + 1] * (1 - gradientOpacity) + g * gradientOpacity // G
        data[idx + 2] = data[idx + 2] * (1 - gradientOpacity) + b * gradientOpacity // B
      }
    }

    ctx.putImageData(imageData, x, y)
  }

  // 피부톤 감지 (간단한 구현)
  const isSkinTone = (r: number, g: number, b: number): boolean => {
    // 매우 간단한 피부톤 감지 (실제로는 더 복잡한 알고리즘 필요)
    return (
      r > 60 &&
      g > 40 &&
      b > 20 && // 최소 값
      r > g &&
      g > b && // 일반적인 피부톤 관계
      r - g < 100 && // 빨간색이 너무 강하지 않음
      r - b < 150
    ) // 파란색이 너무 약하지 않음
  }

  // 필터 적용/해제 토글
  const toggleFilter = () => {
    setIsFilterApplied(!isFilterApplied)
  }

  // 다음 단계로 이동
  const goToNextStep = async () => {
    if (currentStepIndex < steps.length - 1) {
      // 현재 단계 완료 처리
      await saveProgress(false)

      // 다음 단계로 이동
      setCurrentStepIndex((prev) => prev + 1)
      setIsFilterApplied(false)
      setShowTip(false)
    } else {
      // 튜토리얼 완료
      await saveProgress(true)
      setIsCompleted(true)
      onComplete?.()
    }
  }

  // 이전 단계로 이동
  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
      setIsFilterApplied(false)
      setShowTip(false)
    }
  }

  // 진행 상황 저장
  const saveProgress = async (completed: boolean) => {
    try {
      await MakeupTutorialService.saveTutorialProgress({
        userId,
        tutorialId,
        currentStep: currentStepIndex + 1,
        completed,
        startedAt: new Date(),
        completedAt: completed ? new Date() : undefined,
        timeSpent: elapsedTime,
      })
    } catch (error) {
      console.error("Error saving progress:", error)
    }
  }

  // 현재 단계
  const currentStep = steps[currentStepIndex]

  // 전체 진행률
  const progressPercentage = steps.length > 0 ? Math.round(((currentStepIndex + 1) / steps.length) * 100) : 0

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-500">튜토리얼을 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <>
          {/* 튜토리얼 헤더 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">{tutorial?.title}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{tutorial?.duration}분</span>
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{tutorial?.rating}</span>
                </Badge>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{tutorial?.description}</p>

            {/* 진행 상황 */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                진행 상황: {currentStepIndex + 1}/{steps.length} 단계
              </span>
              <span className="text-sm text-gray-500">{progressPercentage}% 완료</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* 메인 콘텐츠 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AR 뷰어 */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">
                    {isStreaming ? "AR 메이크업 튜토리얼" : "카메라를 시작하세요"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "video" | "photo")}>
                    <TabsList className="w-full rounded-none border-b">
                      <TabsTrigger value="video" className="flex-1">
                        실시간 카메라
                      </TabsTrigger>
                      <TabsTrigger value="photo" className="flex-1">
                        튜토리얼 이미지
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="video" className="m-0">
                      <div className="relative bg-gray-100" style={{ aspectRatio: "16/9" }}>
                        {isStreaming ? (
                          <>
                            {/* 숨겨진 비디오 */}
                            <video ref={videoRef} autoPlay playsInline muted className="hidden" />

                            {/* AR 캔버스 */}
                            <canvas ref={canvasRef} className="w-full h-full" />

                            {/* 얼굴 감지 상태 */}
                            <div className="absolute top-4 left-4">
                              <Badge
                                variant="outline"
                                className={`${
                                  faceDetected
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                                }`}
                              >
                                {faceDetected ? "얼굴 감지됨" : "얼굴을 찾는 중..."}
                              </Badge>
                            </div>

                            {/* 필터 상태 */}
                            {activeFilter && (
                              <div className="absolute top-4 right-4">
                                <Badge
                                  variant="outline"
                                  className={`${
                                    isFilterApplied
                                      ? "bg-pink-100 text-pink-800 border-pink-200"
                                      : "bg-gray-100 text-gray-800 border-gray-200"
                                  }`}
                                >
                                  {isFilterApplied ? "필터 적용됨" : "필터 미적용"}
                                </Badge>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500 mb-4">카메라를 시작하여 AR 튜토리얼을 시작하세요</p>
                              <Button onClick={startCamera}>카메라 시작</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="photo" className="m-0">
                      <div className="bg-gray-100" style={{ aspectRatio: "16/9" }}>
                        {currentStep?.imageUrl ? (
                          <img
                            src={currentStep.imageUrl || "/placeholder.svg"}
                            alt={currentStep.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">이미지가 없습니다</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between p-4">
                  {isStreaming && (
                    <>
                      <Button variant="outline" onClick={stopCamera}>
                        카메라 중지
                      </Button>

                      {activeFilter && (
                        <Button variant={isFilterApplied ? "default" : "outline"} onClick={toggleFilter}>
                          {isFilterApplied ? "필터 해제" : "필터 적용"}
                        </Button>
                      )}
                    </>
                  )}
                </CardFooter>
              </Card>
            </div>

            {/* 튜토리얼 단계 */}
            <div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="bg-pink-100 text-pink-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {currentStepIndex + 1}
                    </span>
                    {currentStep?.title}
                  </CardTitle>
                  <CardDescription>{currentStep?.duration}초 소요</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{currentStep?.description}</p>

                  {/* 제품 정보 */}
                  {currentStep?.productName && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">추천 제품</h4>
                      <div className="flex items-center gap-3">
                        {currentStep.productImage && (
                          <img
                            src={currentStep.productImage || "/placeholder.svg"}
                            alt={currentStep.productName}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                        )}
                        <div>
                          <p className="font-medium">{currentStep.productName}</p>
                          <p className="text-xs text-gray-500">{currentStep.productCategory}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 팁 토글 */}
                  {currentStep?.tipText && (
                    <div className="mb-4">
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-between"
                        onClick={() => setShowTip(!showTip)}
                      >
                        <span className="flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          프로 팁
                        </span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${showTip ? "rotate-90" : ""}`} />
                      </Button>

                      {showTip && (
                        <div className="mt-2 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                          {currentStep.tipText}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={goToPrevStep} disabled={currentStepIndex === 0}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    이전
                  </Button>

                  <Button onClick={goToNextStep}>
                    {currentStepIndex < steps.length - 1 ? (
                      <>
                        다음
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    ) : (
                      <>
                        완료
                        <CheckCircle className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* 완료 모달 */}
          {isCompleted && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    튜토리얼 완료!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    축하합니다! <strong>{tutorial?.title}</strong> 튜토리얼을 성공적으로 완료했습니다.
                  </p>
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>소요 시간</span>
                    </div>
                    <span className="font-medium">
                      {Math.floor(elapsedTime / 60)}분 {elapsedTime % 60}초
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => setIsCompleted(false)}>
                    확인
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
