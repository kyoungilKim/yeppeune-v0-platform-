"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BeautyService } from "@/lib/firebase-beauty"
import type { BeautyAnalysis } from "@/types/beauty"
import { Camera, RotateCcw, Sparkles, TrendingUp, Droplets, Zap } from "lucide-react"

export default function BeautyAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<BeautyAnalysis | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 임시 사용자 ID
  const userId = "user123"

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("카메라에 접근할 수 없습니다. 권한을 확인해주세요.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsAnalyzing(true)

    try {
      // 캔버스에 비디오 프레임 캡처
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext("2d")

      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        // 이미지 데이터 URL 생성
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8)

        // AI 분석 시뮬레이션 (실제로는 AI 모델 API 호출)
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // 랜덤 분석 결과 생성 (실제로는 AI 분석 결과)
        const mockAnalysisData = {
          hydration: Math.floor(Math.random() * 40) + 30, // 30-70
          oiliness: Math.floor(Math.random() * 50) + 25, // 25-75
          elasticity: Math.floor(Math.random() * 30) + 60, // 60-90
          pigmentation: Math.floor(Math.random() * 20) + 70, // 70-90
          wrinkles: Math.floor(Math.random() * 30) + 20, // 20-50
          pores: Math.floor(Math.random() * 40) + 30, // 30-70
        }

        const skinScore = Math.floor(
          (mockAnalysisData.hydration +
            (100 - mockAnalysisData.oiliness) +
            mockAnalysisData.elasticity +
            mockAnalysisData.pigmentation +
            (100 - mockAnalysisData.wrinkles) +
            (100 - mockAnalysisData.pores)) /
            6,
        )

        // 피부 타입 결정
        let skinType: "dry" | "oily" | "combination" | "sensitive" | "normal" = "normal"
        if (mockAnalysisData.hydration < 40 && mockAnalysisData.oiliness < 40) {
          skinType = "dry"
        } else if (mockAnalysisData.oiliness > 60) {
          skinType = "oily"
        } else if (mockAnalysisData.oiliness > 50 && mockAnalysisData.hydration < 50) {
          skinType = "combination"
        }

        // 관심사 결정
        const concerns: string[] = []
        if (mockAnalysisData.hydration < 40) concerns.push("건조함")
        if (mockAnalysisData.oiliness > 60) concerns.push("과도한 유분")
        if (mockAnalysisData.wrinkles > 40) concerns.push("주름")
        if (mockAnalysisData.pores > 60) concerns.push("모공")
        if (mockAnalysisData.pigmentation < 80) concerns.push("색소침착")

        // 추천사항 생성
        const recommendations: string[] = []
        if (mockAnalysisData.hydration < 40) {
          recommendations.push("하이알루론산 세럼 사용")
          recommendations.push("수분 크림으로 보습 강화")
        }
        if (mockAnalysisData.oiliness > 60) {
          recommendations.push("살리실산 토너 사용")
          recommendations.push("논코메도제닉 제품 선택")
        }
        if (mockAnalysisData.elasticity < 70) {
          recommendations.push("콜라겐 부스터 제품 사용")
          recommendations.push("페이셜 마사지 실시")
        }

        const analysis: BeautyAnalysis = {
          id: "",
          userId,
          timestamp: new Date(),
          skinScore,
          skinType,
          concerns,
          recommendations,
          imageUrl: imageDataUrl,
          analysisData: mockAnalysisData,
        }

        // Firebase에 저장
        const analysisId = await BeautyService.saveBeautyAnalysis(analysis)
        analysis.id = analysisId

        setAnalysisResult(analysis)
        stopCamera()
      }
    } catch (error) {
      console.error("Error during analysis:", error)
      alert("분석 중 오류가 발생했습니다.")
    } finally {
      setIsAnalyzing(false)
    }
  }, [userId])

  const resetAnalysis = () => {
    setAnalysisResult(null)
    setCameraActive(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 뷰티 분석</h1>
        <p className="text-gray-600">카메라로 얼굴을 촬영하여 개인 맞춤 뷰티 분석을 받아보세요</p>
      </div>

      {!analysisResult ? (
        <div className="space-y-6">
          {/* 카메라 영역 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                카메라 촬영
              </CardTitle>
              <CardDescription>얼굴이 화면 중앙에 오도록 위치를 조정해주세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                {cameraActive ? (
                  <div className="relative">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
                    <div className="absolute inset-0 border-2 border-dashed border-pink-300 m-8 rounded-full opacity-50"></div>
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">카메라를 시작하여 촬영해주세요</p>
                    </div>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex gap-4 mt-4">
                {!cameraActive ? (
                  <Button onClick={startCamera} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    카메라 시작
                  </Button>
                ) : (
                  <>
                    <Button onClick={captureAndAnalyze} disabled={isAnalyzing} className="flex-1">
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          분석 중...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          분석 시작
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={stopCamera}>
                      취소
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 분석 진행 상태 */}
          {isAnalyzing && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="animate-pulse">
                    <Sparkles className="h-12 w-12 text-pink-500 mx-auto mb-4" />
                  </div>
                  <h3 className="text-lg font-semibold">AI가 피부를 분석하고 있습니다</h3>
                  <p className="text-gray-600">잠시만 기다려주세요...</p>
                  <Progress value={66} className="w-full max-w-md mx-auto" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 분석 결과 헤더 */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6 text-pink-500" />
                분석 완료!
              </CardTitle>
              <CardDescription>
                {new Date(analysisResult.timestamp).toLocaleString()}에 분석된 결과입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full text-white text-2xl font-bold mb-4">
                {analysisResult.skinScore}
              </div>
              <h3 className="text-xl font-semibold mb-2">피부 점수: {analysisResult.skinScore}/100</h3>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {analysisResult.skinType === "dry"
                  ? "건성"
                  : analysisResult.skinType === "oily"
                    ? "지성"
                    : analysisResult.skinType === "combination"
                      ? "복합성"
                      : analysisResult.skinType === "sensitive"
                        ? "민감성"
                        : "정상"}
              </Badge>
            </CardContent>
          </Card>

          {/* 상세 분석 결과 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  수분도
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{analysisResult.analysisData.hydration}%</div>
                <Progress value={analysisResult.analysisData.hydration} className="mb-2" />
                <p className="text-xs text-gray-600">
                  {analysisResult.analysisData.hydration < 40
                    ? "수분 부족"
                    : analysisResult.analysisData.hydration < 60
                      ? "보통"
                      : "충분"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  유분도
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{analysisResult.analysisData.oiliness}%</div>
                <Progress value={analysisResult.analysisData.oiliness} className="mb-2" />
                <p className="text-xs text-gray-600">
                  {analysisResult.analysisData.oiliness < 40
                    ? "부족"
                    : analysisResult.analysisData.oiliness < 60
                      ? "보통"
                      : "과다"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  탄력도
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{analysisResult.analysisData.elasticity}%</div>
                <Progress value={analysisResult.analysisData.elasticity} className="mb-2" />
                <p className="text-xs text-gray-600">
                  {analysisResult.analysisData.elasticity < 60
                    ? "개선 필요"
                    : analysisResult.analysisData.elasticity < 80
                      ? "보통"
                      : "우수"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 관심사 및 추천사항 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>주요 관심사</CardTitle>
                <CardDescription>개선이 필요한 부분들</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisResult.concerns.length > 0 ? (
                    analysisResult.concerns.map((concern, index) => (
                      <Badge key={index} variant="secondary" className="mr-2 mb-2">
                        {concern}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500">특별한 관심사가 발견되지 않았습니다.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>맞춤 추천</CardTitle>
                <CardDescription>개선을 위한 추천사항</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisResult.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-4">
            <Button onClick={resetAnalysis} variant="outline" className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              다시 분석하기
            </Button>
            <Button onClick={() => (window.location.href = "/profile")} className="flex-1">
              프로필에서 히스토리 보기
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
