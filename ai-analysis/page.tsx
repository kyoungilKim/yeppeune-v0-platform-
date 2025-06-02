"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AnalysisService } from "@/lib/firebase-analysis"
import type { FaceAnalysis } from "@/types/analysis"
import { Camera, Upload, RotateCcw, Sparkles, Smile, Droplets, Palette, ArrowRight } from "lucide-react"

export default function AIAnalysisPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("face")
  const [isCapturing, setIsCapturing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<FaceAnalysis | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        setIsCapturing(true)
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
      setIsCapturing(false)
    }
  }

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (context) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], "face-analysis.jpg", { type: "image/jpeg" })
            setUploadedFile(file)
            setUploadedImage(URL.createObjectURL(blob))
            stopCamera()
          }
        },
        "image/jpeg",
        0.8,
      )
    }
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setUploadedImage(URL.createObjectURL(file))
    }
  }

  const resetAnalysis = () => {
    setUploadedImage(null)
    setUploadedFile(null)
    setAnalysisResult(null)
    setAnalysisProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const startAnalysis = async () => {
    if (!uploadedFile) return

    try {
      setIsAnalyzing(true)
      setAnalysisProgress(10)

      // 이미지 업로드
      const imageUrl = await AnalysisService.uploadFaceImage(userId, uploadedFile)
      setAnalysisProgress(40)

      // 분석 시작
      const simulateProgress = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 90) {
            clearInterval(simulateProgress)
            return 90
          }
          return prev + 10
        })
      }, 500)

      // 얼굴 분석
      const result = await AnalysisService.analyzeFace(userId, imageUrl)
      setAnalysisResult(result)
      setAnalysisProgress(100)

      clearInterval(simulateProgress)
    } catch (error) {
      console.error("Error during analysis:", error)
      alert("분석 중 오류가 발생했습니다.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const viewConsultation = () => {
    if (analysisResult) {
      router.push(`/consultation?analysisId=${analysisResult.id}`)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 뷰티 분석</h1>
        <p className="text-gray-600">얼굴과 신체 사진을 분석하여 맞춤형 뷰티 솔루션을 제공합니다</p>
      </div>

      <Tabs defaultValue="face" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="face">얼굴 분석</TabsTrigger>
          <TabsTrigger value="body">신체 분석</TabsTrigger>
        </TabsList>

        <TabsContent value="face" className="space-y-6">
          {!analysisResult ? (
            <>
              {!uploadedImage ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 카메라 캡처 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        카메라로 촬영
                      </CardTitle>
                      <CardDescription>얼굴이 화면 중앙에 오도록 위치를 조정해주세요</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                        {isCapturing ? (
                          <div className="relative">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-auto rounded-lg"
                            ></video>
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
                      </div>

                      <div className="flex gap-2">
                        {!isCapturing ? (
                          <Button onClick={startCamera} className="flex-1">
                            <Camera className="h-4 w-4 mr-2" />
                            카메라 시작
                          </Button>
                        ) : (
                          <>
                            <Button onClick={captureImage} className="flex-1">
                              <Camera className="h-4 w-4 mr-2" />
                              촬영하기
                            </Button>
                            <Button variant="outline" onClick={stopCamera}>
                              취소
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 이미지 업로드 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        이미지 업로드
                      </CardTitle>
                      <CardDescription>얼굴이 잘 보이는 사진을 선택해주세요</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-pink-300 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">클릭하여 이미지 선택</p>
                        <p className="text-xs text-gray-400">JPG, PNG 파일 (최대 10MB)</p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/jpeg, image/png"
                          onChange={handleFileUpload}
                        />
                      </div>

                      <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        이미지 선택
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      이미지 분석
                    </CardTitle>
                    <CardDescription>업로드된 이미지를 AI가 분석합니다</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="aspect-square max-h-96 mx-auto rounded-lg overflow-hidden">
                      <img
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Uploaded face"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {isAnalyzing ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>분석 중...</span>
                          <span>{analysisProgress}%</span>
                        </div>
                        <Progress value={analysisProgress} className="w-full" />
                        <div className="text-center text-sm text-gray-500">
                          {analysisProgress < 30
                            ? "이미지 처리 중..."
                            : analysisProgress < 60
                              ? "얼굴 특징 분석 중..."
                              : analysisProgress < 90
                                ? "피부 상태 분석 중..."
                                : "결과 생성 중..."}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Button onClick={startAnalysis} className="flex-1">
                          <Sparkles className="h-4 w-4 mr-2" />
                          분석 시작
                        </Button>
                        <Button variant="outline" onClick={resetAnalysis}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          다시 선택
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="space-y-6">
              {/* 분석 결과 헤더 */}
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <Badge className="bg-pink-500 text-white px-3 py-1 text-sm">분석 완료</Badge>
                  </div>
                  <CardTitle className="text-2xl">얼굴 분석 결과</CardTitle>
                  <CardDescription>
                    {new Date(analysisResult.timestamp).toLocaleString()}에 분석된 결과입니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full text-white text-2xl font-bold mb-4">
                    {analysisResult.beautyScore}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">뷰티 점수: {analysisResult.beautyScore}/100</h3>
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    <Badge variant="outline">{analysisResult.faceShape} 얼굴형</Badge>
                    <Badge variant="outline">{analysisResult.skinTone} 피부톤</Badge>
                    <Badge variant="outline">{analysisResult.skinUndertone} 언더톤</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 얼굴 특징 분석 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smile className="h-5 w-5" />
                    얼굴 특징 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-1">{analysisResult.faceShape}</div>
                      <p className="text-sm text-gray-600">얼굴형</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-1">{analysisResult.eyeShape}</div>
                      <p className="text-sm text-gray-600">눈 모양</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-1">{analysisResult.lipShape}</div>
                      <p className="text-sm text-gray-600">입술 모양</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-1">{analysisResult.noseShape}</div>
                      <p className="text-sm text-gray-600">코 모양</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-1">{analysisResult.cheekbones}</div>
                      <p className="text-sm text-gray-600">광대뼈</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-1">{analysisResult.jawline}</div>
                      <p className="text-sm text-gray-600">턱선</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <h4 className="font-medium">얼굴 조화도</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>대칭성</span>
                          <span>{analysisResult.facialFeatures.symmetry}%</span>
                        </div>
                        <Progress value={analysisResult.facialFeatures.symmetry} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>비율</span>
                          <span>{analysisResult.facialFeatures.proportions}%</span>
                        </div>
                        <Progress value={analysisResult.facialFeatures.proportions} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>조화</span>
                          <span>{analysisResult.facialFeatures.harmony}%</span>
                        </div>
                        <Progress value={analysisResult.facialFeatures.harmony} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 피부 분석 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5" />
                    피부 상태 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>수분도</span>
                        <span>{analysisResult.skinAnalysis.hydration}%</span>
                      </div>
                      <Progress value={analysisResult.skinAnalysis.hydration} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>유분도</span>
                        <span>{analysisResult.skinAnalysis.oiliness}%</span>
                      </div>
                      <Progress value={analysisResult.skinAnalysis.oiliness} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>민감도</span>
                        <span>{analysisResult.skinAnalysis.sensitivity}%</span>
                      </div>
                      <Progress value={analysisResult.skinAnalysis.sensitivity} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>주름</span>
                        <span>{analysisResult.skinAnalysis.wrinkles}%</span>
                      </div>
                      <Progress value={analysisResult.skinAnalysis.wrinkles} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>색소침착</span>
                        <span>{analysisResult.skinAnalysis.spots}%</span>
                      </div>
                      <Progress value={analysisResult.skinAnalysis.spots} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>모공</span>
                        <span>{analysisResult.skinAnalysis.pores}%</span>
                      </div>
                      <Progress value={analysisResult.skinAnalysis.pores} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>붉은기</span>
                        <span>{analysisResult.skinAnalysis.redness}%</span>
                      </div>
                      <Progress value={analysisResult.skinAnalysis.redness} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>톤 균일도</span>
                        <span>{analysisResult.skinAnalysis.evenness}%</span>
                      </div>
                      <Progress value={analysisResult.skinAnalysis.evenness} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>여드름</span>
                        <span>{analysisResult.skinAnalysis.acne}%</span>
                      </div>
                      <Progress value={analysisResult.skinAnalysis.acne} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>블랙헤드</span>
                        <span>{analysisResult.skinAnalysis.blackheads}%</span>
                      </div>
                      <Progress value={analysisResult.skinAnalysis.blackheads} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 컬러 분석 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    퍼스널 컬러 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-2">
                      <Palette className="h-8 w-8 text-pink-500" />
                    </div>
                    <h3 className="text-xl font-semibold">
                      {analysisResult.colorAnalysis.season === "spring"
                        ? "봄 웜톤"
                        : analysisResult.colorAnalysis.season === "summer"
                          ? "여름 쿨톤"
                          : analysisResult.colorAnalysis.season === "autumn"
                            ? "가을 웜톤"
                            : "겨울 쿨톤"}
                    </h3>
                    <p className="text-gray-600">
                      {analysisResult.colorAnalysis.season === "spring"
                        ? "밝고 선명한 컬러가 잘 어울리는 봄 웜톤입니다."
                        : analysisResult.colorAnalysis.season === "summer"
                          ? "부드럽고 차분한 컬러가 잘 어울리는 여름 쿨톤입니다."
                          : analysisResult.colorAnalysis.season === "autumn"
                            ? "깊고 풍부한 컬러가 잘 어울리는 가을 웜톤입니다."
                            : "선명하고 강렬한 컬러가 잘 어울리는 겨울 쿨톤입니다."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">추천 컬러</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.colorAnalysis.bestColors.map((color, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-6 h-6 rounded-full mr-2" style={{ backgroundColor: color }}></div>
                            <span className="text-sm">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">피해야 할 컬러</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.colorAnalysis.avoidColors.map((color, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-6 h-6 rounded-full mr-2" style={{ backgroundColor: color }}></div>
                            <span className="text-sm">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 액션 버튼 */}
              <div className="flex gap-4">
                <Button onClick={resetAnalysis} variant="outline" className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  다시 분석하기
                </Button>
                <Button onClick={viewConsultation} className="flex-1">
                  맞춤 뷰티 컨설팅 보기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="body" className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>신체 분석</CardTitle>
              <CardDescription>전신이 나오는 사진을 업로드하여 체형과 스타일을 분석해보세요</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <div className="max-w-md mx-auto">
                <p className="text-gray-500 mb-6">신체 분석 기능은 현재 개발 중입니다. 곧 만나보실 수 있습니다!</p>
                <Button disabled>준비 중</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 숨겨진 캔버스 */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  )
}
