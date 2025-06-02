"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HairStylingService } from "@/lib/hair-styling-service"
import Hair3DRenderer from "@/components/hair-3d-renderer"
import type {
  HairModel,
  HairColor,
  HairStylePreset,
  HairStylingParams,
  HairSimulationSettings,
} from "@/types/hair-styling"
import { Camera, Download, Scissors, Palette, Sparkles, Save, Share2, Star } from "lucide-react"

export default function HairStylingPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [faceTracking, setFaceTracking] = useState<any>(null)

  // 헤어 스타일링 상태
  const [hairModels, setHairModels] = useState<HairModel[]>([])
  const [hairColors, setHairColors] = useState<HairColor[]>([])
  const [hairPresets, setHairPresets] = useState<HairStylePreset[]>([])

  const [selectedModel, setSelectedModel] = useState<HairModel | null>(null)
  const [selectedColor, setSelectedColor] = useState<HairColor | null>(null)
  const [stylingParams, setStylingParams] = useState<HairStylingParams>({
    volume: 50,
    curl: 30,
    length: 70,
    layering: 50,
    bangs: 40,
    parting: "center",
  })

  const [simulationSettings, setSimulationSettings] = useState<HairSimulationSettings>(
    HairStylingService.getDefaultSimulationSettings(),
  )

  const [activeTab, setActiveTab] = useState("styles")
  const [isLoading, setIsLoading] = useState(true)

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // 헤어 모델, 컬러, 프리셋 로드
        const models = await HairStylingService.getHairModels()
        const colors = await HairStylingService.getHairColors()
        const presets = await HairStylingService.getPopularHairPresets()

        setHairModels(models)
        setHairColors(colors)
        setHairPresets(presets)

        // 기본값 설정
        if (models.length > 0) setSelectedModel(models[0])
        if (colors.length > 0) setSelectedColor(colors[0])
      } catch (error) {
        console.error("Error loading hair styling data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

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
    }
  }

  // 헤어 모델 변경
  const changeHairModel = (modelId: string) => {
    const model = hairModels.find((m) => m.id === modelId)
    if (model) {
      setSelectedModel(model)
    }
  }

  // 헤어 컬러 변경
  const changeHairColor = (colorId: string) => {
    const color = hairColors.find((c) => c.id === colorId)
    if (color) {
      setSelectedColor(color)
    }
  }

  // 프리셋 적용
  const applyPreset = (presetId: string) => {
    const preset = hairPresets.find((p) => p.id === presetId)
    if (preset) {
      // 모델 변경
      const model = hairModels.find((m) => m.id === preset.modelId)
      if (model) setSelectedModel(model)

      // 컬러 변경
      const color = hairColors.find((c) => c.id === preset.colorId)
      if (color) setSelectedColor(color)

      // 스타일링 파라미터 적용
      setStylingParams(preset.styling)
    }
  }

  // 스타일링 파라미터 변경
  const updateStylingParam = (param: keyof HairStylingParams, value: number | string) => {
    setStylingParams((prev) => ({
      ...prev,
      [param]: value,
    }))
  }

  // 시뮬레이션 설정 변경
  const updateSimulationSetting = (category: keyof HairSimulationSettings, param: string, value: any) => {
    setSimulationSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [param]: value,
      },
    }))
  }

  // 스타일 저장
  const saveCurrentStyle = async () => {
    if (!selectedModel || !selectedColor) return

    try {
      // 임시 사용자 ID
      const userId = "user123"

      await HairStylingService.saveHairStylingSession({
        userId,
        timestamp: new Date(),
        selectedModel,
        selectedColor,
        stylingParams,
      })

      alert("헤어 스타일이 저장되었습니다!")
    } catch (error) {
      console.error("Error saving hair style:", error)
      alert("저장 중 오류가 발생했습니다.")
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">3D 가상 헤어 스타일링</h1>
        <p className="text-gray-600">다양한 헤어 스타일과 컬러를 실시간으로 체험해보세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D 렌더링 영역 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                3D 헤어 스타일링
              </CardTitle>
              <CardDescription>실시간 3D 헤어 스타일 시뮬레이션</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "16/9" }}>
                {isStreaming && selectedModel && selectedColor ? (
                  <>
                    {/* 숨겨진 비디오 엘리먼트 */}
                    <video ref={videoRef} autoPlay playsInline muted className="hidden" />

                    {/* 3D 헤어 렌더러 */}
                    <Hair3DRenderer
                      videoElement={videoRef.current}
                      hairModel={selectedModel}
                      hairColor={selectedColor}
                      stylingParams={stylingParams}
                      simulationSettings={simulationSettings}
                      onFaceTracking={setFaceTracking}
                    />
                  </>
                ) : (
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <Scissors className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        {isLoading ? "데이터를 불러오는 중..." : "카메라를 시작하여 3D 헤어 스타일링을 체험해보세요"}
                      </p>
                      {!isLoading && (
                        <Button onClick={startCamera} disabled={isStreaming}>
                          <Camera className="h-4 w-4 mr-2" />
                          카메라 시작
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 컨트롤 버튼 */}
              {isStreaming && (
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button onClick={saveCurrentStyle}>
                    <Save className="h-4 w-4 mr-2" />
                    스타일 저장
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    이미지 저장
                  </Button>
                  <Button variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    공유하기
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>
                    카메라 중지
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 스타일링 컨트롤 */}
          {isStreaming && selectedModel && selectedColor && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>헤어 스타일링 조절</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">볼륨</label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[stylingParams.volume]}
                        onValueChange={([value]) => updateStylingParam("volume", value)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-10 text-right">{stylingParams.volume}%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">컬</label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[stylingParams.curl]}
                        onValueChange={([value]) => updateStylingParam("curl", value)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-10 text-right">{stylingParams.curl}%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">길이</label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[stylingParams.length]}
                        onValueChange={([value]) => updateStylingParam("length", value)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-10 text-right">{stylingParams.length}%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">레이어링</label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[stylingParams.layering]}
                        onValueChange={([value]) => updateStylingParam("layering", value)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-10 text-right">{stylingParams.layering}%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">앞머리</label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[stylingParams.bangs]}
                        onValueChange={([value]) => updateStylingParam("bangs", value)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-10 text-right">{stylingParams.bangs}%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">가르마</label>
                    <Select
                      value={stylingParams.parting}
                      onValueChange={(value) => updateStylingParam("parting", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">왼쪽</SelectItem>
                        <SelectItem value="center">가운데</SelectItem>
                        <SelectItem value="right">오른쪽</SelectItem>
                        <SelectItem value="none">없음</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">물리 시뮬레이션</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">바람</label>
                        <Slider
                          value={[simulationSettings.physics.wind]}
                          onValueChange={([value]) => updateSimulationSetting("physics", "wind", value)}
                          max={100}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">강성</label>
                        <Slider
                          value={[simulationSettings.physics.stiffness]}
                          onValueChange={([value]) => updateSimulationSetting("physics", "stiffness", value)}
                          max={100}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 헤어 스타일 선택 영역 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>헤어 스타일 & 컬러</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="styles">스타일</TabsTrigger>
                  <TabsTrigger value="colors">컬러</TabsTrigger>
                  <TabsTrigger value="presets">프리셋</TabsTrigger>
                </TabsList>

                {/* 헤어 스타일 탭 */}
                <TabsContent value="styles" className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <Scissors className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-gray-500">헤어 스타일을 불러오는 중...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {hairModels.map((model) => (
                        <div
                          key={model.id}
                          className={`p-2 border rounded-lg cursor-pointer transition-all ${
                            selectedModel?.id === model.id
                              ? "border-pink-500 bg-pink-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => changeHairModel(model.id)}
                        >
                          <div className="aspect-square rounded-md overflow-hidden mb-2">
                            <img
                              src={model.thumbnail || "/placeholder.svg"}
                              alt={model.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-sm font-medium text-center">{model.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* 헤어 컬러 탭 */}
                <TabsContent value="colors" className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <Palette className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-gray-500">헤어 컬러를 불러오는 중...</p>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-medium">내추럴 컬러</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {hairColors
                          .filter((color) => color.category === "natural")
                          .map((color) => (
                            <div
                              key={color.id}
                              className={`cursor-pointer transition-all ${
                                selectedColor?.id === color.id ? "ring-2 ring-pink-500" : ""
                              }`}
                              onClick={() => changeHairColor(color.id)}
                            >
                              <div
                                className="w-full aspect-square rounded-full border"
                                style={{ backgroundColor: color.hexColor }}
                              />
                              <div className="text-xs text-center mt-1">{color.name}</div>
                            </div>
                          ))}
                      </div>

                      <h3 className="font-medium mt-4">판타지 컬러</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {hairColors
                          .filter((color) => color.category === "fantasy")
                          .map((color) => (
                            <div
                              key={color.id}
                              className={`cursor-pointer transition-all ${
                                selectedColor?.id === color.id ? "ring-2 ring-pink-500" : ""
                              }`}
                              onClick={() => changeHairColor(color.id)}
                            >
                              <div
                                className="w-full aspect-square rounded-full border"
                                style={{ backgroundColor: color.hexColor }}
                              />
                              <div className="text-xs text-center mt-1">{color.name}</div>
                            </div>
                          ))}
                      </div>

                      <h3 className="font-medium mt-4">옴브레 & 발레아쥬</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {hairColors
                          .filter((color) => ["ombre", "balayage"].includes(color.category))
                          .map((color) => (
                            <div
                              key={color.id}
                              className={`cursor-pointer transition-all ${
                                selectedColor?.id === color.id ? "ring-2 ring-pink-500" : ""
                              }`}
                              onClick={() => changeHairColor(color.id)}
                            >
                              <div
                                className="w-full aspect-square rounded-full border"
                                style={{ backgroundColor: color.hexColor }}
                              />
                              <div className="text-xs text-center mt-1">{color.name}</div>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* 프리셋 탭 */}
                <TabsContent value="presets" className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-gray-500">프리셋을 불러오는 중...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {hairPresets.map((preset) => (
                        <div
                          key={preset.id}
                          className="border rounded-lg overflow-hidden cursor-pointer hover:border-pink-300 transition-all"
                          onClick={() => applyPreset(preset.id)}
                        >
                          <div className="flex items-center">
                            <div className="w-20 h-20">
                              <img
                                src={preset.thumbnail || "/placeholder.svg"}
                                alt={preset.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-3 flex-1">
                              <div className="font-medium">{preset.name}</div>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < preset.popularity / 20 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                <span className="text-xs text-gray-500 ml-1">{preset.popularity}% 인기</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 추천 헤어 스타일 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                얼굴형 맞춤 추천
              </CardTitle>
            </CardHeader>
            <CardContent>
              {faceTracking?.faceShape ? (
                <div className="space-y-4">
                  <div className="bg-pink-50 p-3 rounded-lg">
                    <div className="font-medium">감지된 얼굴형: {faceTracking.faceShape}</div>
                    <p className="text-sm text-gray-600 mt-1">
                      {faceTracking.faceShape === "oval"
                        ? "타원형 얼굴은 대부분의 헤어스타일과 잘 어울립니다."
                        : faceTracking.faceShape === "round"
                          ? "둥근 얼굴은 길이감이 있는 스타일이 잘 어울립니다."
                          : faceTracking.faceShape === "square"
                            ? "각진 얼굴은 부드러운 웨이브가 잘 어울립니다."
                            : "이 얼굴형에 맞는 스타일을 추천해드립니다."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium">추천 스타일</div>
                    <div className="grid grid-cols-2 gap-2">
                      {hairModels
                        .filter((_, index) => index < 4) // 임시로 처음 4개만 표시
                        .map((model) => (
                          <div
                            key={model.id}
                            className="p-2 border rounded-lg cursor-pointer hover:border-pink-300 transition-all"
                            onClick={() => changeHairModel(model.id)}
                          >
                            <div className="aspect-square rounded-md overflow-hidden">
                              <img
                                src={model.thumbnail || "/placeholder.svg"}
                                alt={model.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-xs font-medium text-center mt-1">{model.name}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">
                    {isStreaming
                      ? "얼굴을 감지하면 맞춤 헤어 스타일을 추천해드립니다."
                      : "카메라를 시작하면 얼굴형에 맞는 헤어 스타일을 추천해드립니다."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
