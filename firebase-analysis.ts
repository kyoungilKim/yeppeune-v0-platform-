import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "./firebase"
import type { FaceAnalysis } from "@/types/analysis"

export class AnalysisService {
  // 얼굴 분석 관리
  static async uploadFaceImage(userId: string, imageFile: File): Promise<string> {
    try {
      // 스토리지에 이미지 업로드
      const storageRef = ref(storage, `users/${userId}/face-analysis/${Date.now()}_${imageFile.name}`)
      await uploadBytes(storageRef, imageFile)
      const imageUrl = await getDownloadURL(storageRef)
      return imageUrl
    } catch (error) {
      console.error("Error uploading face image:", error)
      throw error
    }
  }

  static async analyzeFace(userId: string, imageUrl: string): Promise<FaceAnalysis> {
    try {
      // 실제로는 여기서 AI API를 호출하여 얼굴 분석을 수행
      // 지금은 시뮬레이션된 결과를 반환

      // 랜덤 분석 결과 생성
      const faceShapes = ["oval", "round", "square", "heart", "long", "diamond"]
      const skinTones = ["fair", "light", "medium", "olive", "tan", "deep"]
      const skinUndertones = ["cool", "warm", "neutral"]
      const eyeShapes = ["almond", "round", "monolid", "hooded", "downturned", "upturned"]
      const lipShapes = ["full", "thin", "wide", "heart", "round"]
      const noseShapes = ["straight", "button", "roman", "bulbous", "wide"]
      const cheekbones = ["high", "medium", "low"]
      const jawlines = ["strong", "medium", "soft"]
      const seasons = ["spring", "summer", "autumn", "winter"]

      const getRandomElement = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)]
      const getRandomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min

      const bestColors = [
        "#FF5733",
        "#33FF57",
        "#3357FF",
        "#F3FF33",
        "#FF33F3",
        "#33FFF3",
        "#8033FF",
        "#FF8033",
      ]
      const avoidColors = ["#000000", "#FFFFFF", "#808080", "#A52A2A", "#FFD700", "#008000"]

      // 랜덤 색상 선택
      const getRandomColors = (colors: string[], count: number): string[] => {
        const shuffled = [...colors].sort(() => 0.5 - Math.random())
        return shuffled.slice(0, count)
      }
\
      const analysis: Omit<FaceAnalysis, "id"> = {
        userId,
        timestamp: new Date(),
        imageUrl,\
        faceShape: getRandomElement(faceShapes) as any,\
        skinTone: getRandomElement(skinTones) as any,
        skinUndertone: getRandomElement(skinUndertones) as any,
        eyeShape: getRandomElement(eyeShapes) as any,
        eyeColor: ["brown", "blue", "green", "hazel", "gray"][Math.floor(Math.random() * 5)],
        lipShape: getRandomElement(lipShapes) as any,
        noseShape: getRandomElement(noseShapes) as any,
        cheekbones: getRandomElement(cheekbones) as any,
        jawline: getRandomElement(jawlines) as any,
        facialFeatures: {
          symmetry: getRandomNumber(70, 95),
          proportions: getRandomNumber(65, 95),
          harmony: getRandomNumber(70, 95),\
        },
        skinAnalysis: {
          wrinkles: getRandomNumber(10, 60),
          spots: getRandomNumber(10, 70),
          pores: getRandomNumber(20, 80),\
          redness: getRandomNumber(10, 60),
          evenness: getRandomNumber(40, 90),
          hydration: getRandomNumber(30, 90),
          oiliness: getRandomNumber(20, 80),
          sensitivity: getRandomNumber(10, 70),
          acne: getRandomNumber(5, 50),
          blackheads: getRandomNumber(10, 60),
        },
        colorAnalysis: {
          season: getRandomElement(seasons) as any,
          bestColors: getRandomColors(bestColors, 5),\
          avoidColors: getRandomColors(avoidColors, 3),
        },
        beautyScore: getRandomNumber(70, 95),
      }

      // Firestore에 분석 결과 저장
      const docRef = await addDoc(collection(db, "faceAnalyses"), {
        ...analysis,
        timestamp: Timestamp.fromDate(analysis.timestamp),
      })

      return {
        id: docRef.id,
        ...analysis,
      }
    } catch (error) {\
      console.error("Error analyzing face:", error)
      throw error
    }\
  }
\
  static async getFaceAnalyses(userId: string, limitCount = 10): Promise<FaceAnalysis[]> {
    try {
      const q = query(
        collection(db, "faceAnalyses"),
        where("userId", "==", userId),
        orderBy(\"timestamp", \"desc"),\
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as FaceAnalysis[]
    } catch (error) {\
      console.error("Error getting face analyses:", error)
      return []
    }
  }
\
  static async getLatestFaceAnalysis(userId: string): Promise<FaceAnalysis | null> {
    try {
      const analyses = await this.getFaceAnalyses(userId, 1)
      return analyses.length > 0 ? analyses[0] : null\
    } catch (error) {\
      console.error("Error getting latest face analysis:", error)
      return null
    }
  }

  // 스타일 선호도 관리\
  static async saveStylePreference(preference: Omit<StylePreference, "id" | "updatedAt">): Promise<string> {
    try {
      // 기존 선호도 확인
      const q = query(collection(db, "stylePreferences"), where("userId", "==\", preference.userId))\
      const querySnapshot = await getDocs(q)
\
      if (!querySnapshot.empty) {
        // 기존 선호도 업데이트
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          ...preference,
          updatedAt: Timestamp.now(),
        })
        return querySnapshot.docs[0].id\
      } else {
        // 새 선호도 생성
        const docRef = await addDoc(collection(db, "stylePreferences"), {\
          ...preference,
          updatedAt: Timestamp.now(),
        })
        return docRef.id
      }
    } catch (error) {\
      console.error("Error saving style preference:", error)
      throw error\
    }
  }

  static async getStylePreference(userId: string): Promise<StylePreference | null> {
    try {\
      const q = query(collection(db, "stylePreferences"), where("userId", "==", userId))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) return null
\
      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt.toDate(),
      } as StylePreference
    } catch (error) {
      console.error("Error getting style preference:", error)\
      return null
    }
  }

  // 뷰티 컨설팅 관리
  static async generateBeautyConsultation(userId: string, faceAnalysisId?: string): Promise<BeautyConsultation> {
    try {
      // 얼굴 분석 데이터 가져오기
      let faceAnalysis: FaceAnalysis | null = null
      if (faceAnalysisId) {
        const docRef = doc(db, "faceAnalyses", faceAnalysisId)\
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          faceAnalysis = {\
            id: docSnap.id,
            ...docSnap.data(),\
            timestamp: docSnap.data().timestamp.toDate(),
          } as FaceAnalysis
        }
      } else {
        faceAnalysis = await this.getLatestFaceAnalysis(userId)
      }

      // 스타일 선호도 가져오기
      const stylePreference = await this.getStylePreference(userId)

      // 실제로는 여기서 AI 모델을 사용하여 추천 생성
      // 지금은 시뮬레이션된 결과를 반환

      // 메이크업 추천
      const makeupBrands = ["글로우랩", "에뛰드", "맥", "나스", "샤넬", "디올", "메이블린", "로레알"]
      const skincareBrands = ["이니스프리", "라네즈", "설화수", "시세이도", "에스티로더", "클리니크", "키엘", "닥터자르트"]
      const hairBrands = ["케라스타즈", "모로칸오일", "아베다", "미쟝센", "팬틴", "헤드앤숄더", "로레알", "웰라"]
      const fashionBrands = ["자라", "H&M", "유니클로", "COS", "마시모두띠", "망고", "에잇세컨즈", "스파오"]

      const getRandomBrand = (brands: string[]): string => brands[Math.floor(Math.random() * brands.length)]
      const getRandomPrice = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1) + min) * 1000

      // 피부톤에 따른 파운데이션 추천
      const getFoundationByTone = (tone: string): string => {
        switch (tone) {
          case "fair":
            return "아이보리 13"
          case "light":
            return "베이지 21"
          case "medium":
            return "베이지 23"
          case "olive":
            return "베이지 25"
          case "tan":
            return "앰버 27"
          case "deep":
            return "앰버 31"
          default:
            return "베이지 21"
        }
      }

      // 계절에 따른 색상 추천
      const getColorsByseason = (season: string): string[] => {
        switch (season) {
          case "spring":
            return ["코랄", "피치", "웜베이지", "골드", "아이보리"]
          case "summer":
            return ["로즈", "라벤더", "소프트핑크", "블루", "그레이"]
          case "autumn":
            return ["테라코타", "올리브", "머스타드", "카멜", "브라운"]
          case "winter":
            return ["퓨어화이트", "블랙", "플럼", "버건디", "네이비"]
          default:
            return ["코랄", "베이지", "핑크", "브라운", "레드"]
        }
      }

      // 얼굴형에 따른 헤어스타일 추천
      const getHairstyleByFaceShape = (shape: string): { name: string; description: string } => {
        switch (shape) {
          case "oval":
            return {
              name: "레이어드 컷",
              description: "얼굴형을 더욱 돋보이게 하는 레이어드 컷으로 자연스러운 볼륨감을 연출합니다.",
            }
          case "round":
            return {
              name: "긴 레이어드 컷",
              description: "얼굴을 길어 보이게 하는 긴 레이어드 컷으로 세로 라인을 강조합니다.",
            }
          case "square":
            return {
              name: "소프트 레이어드 컷",
              description: "각진 턱선을 부드럽게 보이게 하는 소프트한 레이어드 컷입니다.",
            }
          case "heart":
            return {
              name: "턱선 기장 밥컷",
              description: "넓은 이마와 좁은 턱선의 균형을 맞춰주는 턱선 기장의 밥컷입니다.",
            }
          case "long":
            return {
              name: "사이드 뱅 미디엄 컷",
              description: "긴 얼굴형을 보완해주는 사이드 뱅과 미디엄 기장의 헤어스타일입니다.",
            }
          case "diamond":
            return {
              name: "커튼 뱅 레이어드 컷",
              description: "광대뼈를 부드럽게 보이게 하는 커튼 뱅과 레이어드 컷의 조합입니다.",
            }
          default:
            return {
              name: "클래식 미디엄 컷",
              description: "다양한 스타일링이 가능한 만능 미디엄 기장의 헤어스타일입니다.",
            }
        }
      }

      const foundation = {
        shade: faceAnalysis ? getFoundationByTone(faceAnalysis.skinTone) : "베이지 21",
        brand: getRandomBrand(makeupBrands),
        productName: "퍼펙트 커버 파운데이션",
        price: getRandomPrice(20, 45),
        coverage: ["sheer", "light", "medium", "full"][Math.floor(Math.random() * 4)] as any,
        finish: ["matte", "natural", "dewy", "satin"][Math.floor(Math.random() * 4)] as any,
        imageUrl: "/placeholder.svg?height=200&width=200",
        reason: faceAnalysis
          ? `${faceAnalysis.skinTone} 피부톤과 ${
              faceAnalysis.skinUndertone
            } 언더톤에 최적화된 쉐이드입니다. ${
              faceAnalysis.skinAnalysis.redness > 50 ? "붉은기를 커버하고 " : ""
            }자연스러운 피부 표현이 가능합니다.`
          : "자연스러운 피부 표현이 가능한 제품입니다.",
      }

      const seasonColors = faceAnalysis ? getColorsByseason(faceAnalysis.colorAnalysis.season) : ["코랄", "베이지", "핑크"]

      const hairstyleRec = faceAnalysis
        ? getHairstyleByFaceShape(faceAnalysis.faceShape)
        : { name: "클래식 미디엄 컷", description: "다양한 스타일링이 가능한 만능 미디엄 기장의 헤어스타일입니다." }

      // 뷰티 컨설팅 생성
      const consultation: Omit<BeautyConsultation, "id"> = {
        userId,
        timestamp: new Date(),
        faceAnalysisId: faceAnalysis?.id,
        makeupRecommendations: {
          foundation,
          concealer: {
            shade: foundation.shade,
            brand: foundation.brand,
            productName: "롱웨어 컨실러",
            price: getRandomPrice(15, 30),
            imageUrl: "/placeholder.svg?height=200&width=200",
            reason: "파운데이션과 완벽한 조화를 이루는 컨실러입니다.",
          },
          eyeshadow: {
            palette: `${seasonColors[0]} 팔레트`,
            brand: getRandomBrand(makeupBrands),
            colors: seasonColors.slice(0, 4),
            price: getRandomPrice(25, 60),
            imageUrl: "/placeholder.svg?height=200&width=200",
            reason: faceAnalysis
              ? `${faceAnalysis.colorAnalysis.season} 계절 타입에 어울리는 컬러 조합입니다. ${faceAnalysis.eyeColor} 눈동자 색상을 더욱 돋보이게 합니다.`
              : "다양한 룩을 연출할 수 있는 컬러 조합입니다.",
          },
          blush: {
            shade: seasonColors[0],
            brand: getRandomBrand(makeupBrands),
            productName: `내추럴 블러셔 - ${seasonColors[0]}`,
            price: getRandomPrice(15, 35),
            imageUrl: "/placeholder.svg?height=200&width=200",
            reason: faceAnalysis
              ? `${faceAnalysis.skinTone} 피부톤에 자연스러운 혈색을 더해주는 컬러입니다.`
              : "자연스러운 혈색을 더해주는 컬러입니다.",
          },
          lipstick: {
            shade: seasonColors[1],
            brand: getRandomBrand(makeupBrands),
            productName: `크리미 립스틱 - ${seasonColors[1]}`,
            price: getRandomPrice(18, 40),
            finish: ["matte", "cream", "gloss", "satin"][Math.floor(Math.random() * 4)] as any,
            imageUrl: "/placeholder.svg?height=200&width=200",
            reason: faceAnalysis
              ? `${faceAnalysis.lipShape} 입술 형태를 돋보이게 하며, ${faceAnalysis.colorAnalysis.season} 계절 타입에 어울리는 컬러입니다.`
              : "다양한 메이크업 룩에 어울리는 만능 컬러입니다.",
          },
        },
        skincareRecommendations: {
          cleanser: {
            brand: getRandomBrand(skincareBrands),
            productName: "젠틀 클렌징 폼",
            price: getRandomPrice(15, 30),
            skinConcerns: faceAnalysis
              ? [
                  faceAnalysis.skinAnalysis.sensitivity > 50 ? "민감성" : "일반",
                  faceAnalysis.skinAnalysis.oiliness > 60 ? "지성" : faceAnalysis.skinAnalysis.hydration < 40 ? "건성" : "중성",
                ]
              : ["일반", "중성"],
            keyIngredients: ["판테놀", "세라마이드", "글리세린"],
            imageUrl: "/placeholder.svg?height=200&width=200",
            reason: faceAnalysis
              ? `${
                  faceAnalysis.skinAnalysis.sensitivity > 50 ? "민감한 피부를 위한 저자극 " : ""
                }클렌저로, 피부 장벽을 보호하면서 노폐물을 효과적으로 제거합니다.`
              : "피부 장벽을 보호하면서 노폐물을 효과적으로 제거하는 클렌저입니다.",
          },
          toner: {
            brand: getRandomBrand(skincareBrands),
            productName: faceAnalysis?.skinAnalysis.hydration < 50 ? "하이드레이팅 토너" : "밸런싱 토너",
            price: getRandomPrice(18, 35),
            skinConcerns: faceAnalysis
              ? [
                  faceAnalysis.skinAnalysis.hydration < 50 ? "건조함" : "유분 조절",
                  faceAnalysis.skinAnalysis.sensitivity > 50 ? "민감성" : "모공 관리",
                ]
              : ["수분 공급", "진정"],
            keyIngredients: ["히알루론산", "판테놀", "녹차 추출물"],
            imageUrl: "/placeholder.svg?height=200&width=200",
            reason: faceAnalysis
              ? `${
                  faceAnalysis.skinAnalysis.hydration < 50 ? "부족한 수분을 채워주는 " : "과도한 유분을 조절하는 "
                }토너로, 피부 밸런스를 맞춰줍니다.`
              : "피부 밸런스를 맞춰주는 토너입니다.",
          },
          serum: {
            brand: getRandomBrand(skincareBrands),
            productName: faceAnalysis?.skinAnalysis.wrinkles > 40 ? "안티에이징 세럼" : "브라이트닝 세럼",
            price: getRandomPrice(35, 80),
            skinConcerns: faceAnalysis
              ? [
                  faceAnalysis.skinAnalysis.wrinkles > 40 ? "주름" : "탄력",
                  faceAnalysis.skinAnalysis.spots > 50 ? "색소침착" : "톤 개선",
                ]
              : ["탄력", "톤 개선"],
            keyIngredients: ["나이아신아마이드", "펩타이드", "비타민C"],
            imageUrl: "/placeholder.svg?height=200&width=200",
            reason: faceAnalysis
              ? `${
                  faceAnalysis.skinAnalysis.wrinkles > 40
                    ? "주름 개선에 효과적인 "
                    : faceAnalysis.skinAnalysis.spots > 50
                      ? "색소침착 개선에 효과적인 "
                      : "피부 톤 개선에 효과적인 "
                }세럼으로, 집중적인 케어가 가능합니다.`
              : "피부 톤과 탄력을 개선하는 세럼입니다.",
          },
          moisturizer: {
            brand: getRandomBrand(skincareBrands),
            productName: faceAnalysis?.skinAnalysis.hydration < 50 ? "인텐시브 모이스처라이저" : "라이트 모이스처라이저",
            price: getRandomPrice(25, 60),
            skinConcerns: faceAnalysis
              ? [
                  faceAnalysis.skinAnalysis.hydration < 50 ? "건조함" : "유분 조절",
                  faceAnalysis.skinAnalysis.sensitivity > 50 ? "민감성" : "탄력",
                ]
              : ["수분 공급", "탄력"],
            keyIngredients: ["세라마이드", "히알루론산", "스쿠알란"],
            imageUrl: "/placeholder.svg?height=200&width=200",
            reason: faceAnalysis
              ? `${
                  faceAnalysis.skinAnalysis.hydration < 50
                    ? "건조한 피부에 깊은 보습을 제공하는 "
                    : "과도한 유분 없이 가볍게 수분을 공급하는 "
                }크림으로, 피부 장벽을 강화합니다.`
              : "피부 장벽을 강화하는 모이스처라이저입니다.",
          },
          sunscreen: {
            brand: getRandomBrand(skincareBrands),
            productName: faceAnalysis?.skinAnalysis.oiliness > 60 ? "오일프리 선크림" : "모이스처라이징 선크림",
            price: getRandomPrice(20, 45),
            spf: 50,
            finish: faceAnalysis?.skinAnalysis.oiliness > 60 ? "matte" : "natural",
            imageUrl: "/placeholder.svg?height=200&width=200",
            reason: faceAnalysis
              ? `${
                  faceAnalysis.skinAnalysis.oiliness > 60
                    ? "지성 피부를 위한 산뜻한 사용감의 "
                    : faceAnalysis.skinAnalysis.hydration < 50
                      ? "건성 피부를 위한 촉촉한 "
                      : "모든 피부 타입에 적합한 "
                }선크림으로, 자외선으로부터 피부를 효과적으로 보호합니다.`
              : "자외선으로부터 피부를 효과적으로 보호하는 선크림입니다.",
          },
        },
        hairRecommendations: {
          hairstyles: [
            {
              name: hairstyleRec.name,
              description: hairstyleRec.description,
              imageUrl: "/placeholder.svg?height=300&width=300",
              reason: faceAnalysis
                ? `${faceAnalysis.faceShape} 얼굴형에 가장 잘 어울리는 헤어스타일입니다.`
                : "다양한 얼굴형에 잘 어울리는 헤어스타일입니다.",
            },
            {
              name: "볼륨 웨이브",
              description: "자연스러운 볼륨감과 웨이브로 여성스러운 분위기를 연출합니다.",
              imageUrl: "/placeholder.svg?height=300&width=300",
              reason: "부드러운 인상을 주는 웨이브 스타일로, 다양한 얼굴형에 잘 어울립니다.",
            },
          ],
          hairColor: {
            name: faceAnalysis
              ? faceAnalysis.colorAnalysis.season === "spring" || faceAnalysis.colorAnalysis.season === "autumn"
                ? "웜톤 브라운"
                : "쿨톤 애쉬"
              : "내추럴 브라운",
            description: faceAnalysis
              ? faceAnalysis.colorAnalysis.season === "spring" || faceAnalysis.colorAnalysis.season === "autumn"
                ? "따뜻한 느낌의 골드 브라운 계열 컬러"
                : "차분한 느낌의 애쉬 계열 컬러"
              : "자연스러운 브라운 계열 컬러",
            imageUrl: "/placeholder.svg?height=300&width=300",
            reason: faceAnalysis
              ? `${faceAnalysis.colorAnalysis.season} 계절 타입과 ${faceAnalysis.skinTone} 피부톤에 가장 잘 어울리는 헤어 컬러입니다.`
              : "다양한 피부톤에 자연스럽게 어울리는 헤어 컬러입니다.",
          },
          haircare: [
            {
              brand: getRandomBrand(hairBrands),
              productName: faceAnalysis?.skinAnalysis.hydration < 50 ? "인텐시브 모이스처 샴푸" : "데일리 케어 샴푸",
              price: getRandomPrice(15, 40),
              hairConcerns: ["건조함", "손상모", "윤기"],
              imageUrl: "/placeholder.svg?height=200&width=200",
              reason: "두피와 모발에 필요한 영양을 공급하는 샴푸입니다.",
            },
            {
              brand: getRandomBrand(hairBrands),
              productName: "데미지 리페어 트리트먼트",
              price: getRandomPrice(20, 50),
              hairConcerns: ["손상모", "탄력", "부드러움"],
              imageUrl: "/placeholder.svg?height=200&width=200",
              reason: "손상된 모발을 집중적으로 케어하는 트리트먼트입니다.",
            },
          ],
        },
        fashionRecommendations: {
          outfits: [
            {
              name: "캐주얼 시크",
              description: "편안하면서도 세련된 데일리 룩",
              imageUrl: "/placeholder.svg?height=400&width=300",
              reason: stylePreference
                ? `${stylePreference.casualStyle.join(", ")} 스타일을 선호하시는 취향에 맞춘 데일리 룩입니다.`
                : "다양한 상황에 활용하기 좋은 만능 데일리 룩입니다.",
              items: [
                {
                  type: "top",
                  brand: getRandomBrand(fashionBrands),
                  productName: "베이직 니트 탑",
                  price: getRandomPrice(30, 60),
                  imageUrl: "/placeholder.svg?height=200&width=200",
                },
                {
                  type: "bottom",
                  brand: getRandomBrand(fashionBrands),
                  productName: "슬림핏 데님 팬츠",
                  price: getRandomPrice(40, 80),
                  imageUrl: "/placeholder.svg?height=200&width=200",
                },
                {
                  type: "outer",
                  brand: getRandomBrand(fashionBrands),
                  productName: "오버사이즈 블레이저",
                  price: getRandomPrice(70, 120),
                  imageUrl: "/placeholder.svg?height=200&width=200",
                },
              ],
            },
            {
              name: "모던 페미닌",
              description: "우아하면서도 현대적인 여성스러운 룩",
              imageUrl: "/placeholder.svg?height=400&width=300",
              reason: "여성스러운 실루엣과 모던한 디테일이 조화를 이루는 스타일입니다.",
              items: [
                {
                  type: "dress",
                  brand: getRandomBrand(fashionBrands),
                  productName: "플로럴 미디 원피스",
                  price: getRandomPrice(60, 120),
                  imageUrl: "/placeholder.svg?height=200&width=200",
                },
                {
                  type: "outer",
                  brand: getRandomBrand(fashionBrands),
                  productName: "크롭 트렌치 코트",
                  price: getRandomPrice(80, 150),
                  imageUrl: "/placeholder.svg?height=200&width=200",
                },
              ],
            },
          ],
          accessories: [
            {
              type: "bag",
              brand: getRandomBrand(fashionBrands),
              productName: "미니멀 크로스백",
              price: getRandomPrice(40, 100),
              imageUrl: "/placeholder.svg?height=200&width=200",
              reason: "다양한 룩에 매치하기 좋은 실용적인 디자인입니다.",
            },
            {
              type: "shoes",
              brand: getRandomBrand(fashionBrands),
              productName: "클래식 앵클 부츠",
              price: getRandomPrice(50, 120),
              imageUrl: "/placeholder.svg?height=200&width=200",
              reason: "시즌리스로 활용도 높은 만능 슈즈입니다.",
            },
            {
              type: "jewelry",
              brand: getRandomBrand(fashionBrands),
              productName: "미니멀 골드 이어링",
              price: getRandomPrice(20, 60),
              imageUrl: "/placeholder.svg?height=200&width=200",
              reason: faceAnalysis
                ? `${faceAnalysis.faceShape} 얼굴형을 돋보이게 하는 디자인입니다.`
                : "어떤 룩에도 잘 어울리는 클래식한 디자인입니다.",
            },
          ],
          avoidStyles: stylePreference?.dislikedStyles || ["과한 러플", "지나치게 화려한 패턴", "오버사이즈 실루엣"],
        },
      }

      // Firestore에 컨설팅 결과 저장
      const docRef = await addDoc(collection(db, "beautyConsultations"), {
        ...consultation,
        timestamp: Timestamp.fromDate(consultation.timestamp),
      })

      return {
        id: docRef.id,
        ...consultation,
      }
    } catch (error) {
      console.error("Error generating beauty consultation:", error)
      throw error
    }
  }

  static async getBeautyConsultations(userId: string, limitCount = 5): Promise<BeautyConsultation[]> {
    try {
      const q = query(
        collection(db, "beautyConsultations"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as BeautyConsultation[]
    } catch (error) {
      console.error("Error getting beauty consultations:", error)
      return []
    }
  }

  static async getLatestBeautyConsultation(userId: string): Promise<BeautyConsultation | null> {
    try {
      const consultations = await this.getBeautyConsultations(userId, 1)
      return consultations.length > 0 ? consultations[0] : null
    } catch (error) {
      console.error("Error getting latest beauty consultation:", error)
      return null
    }
  }
}
