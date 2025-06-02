import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import type { AgeTrend, AgeGroupRecommendation } from "@/types/age-trends"

export class AgeTrendService {
  // 연령대별 트렌드 관리
  static async getAgeTrends(
    ageGroup?: "20s" | "30s" | "40s" | "50s" | "60s",
    year?: number,
    season?: "spring" | "summer" | "fall" | "winter",
    limitCount = 10,
  ): Promise<AgeTrend[]> {
    try {
      let q = query(collection(db, "ageTrends"), orderBy("updatedAt", "desc"))

      if (ageGroup) {
        q = query(q, where("ageGroup", "==", ageGroup))
      }

      if (year) {
        q = query(q, where("year", "==", year))
      }

      if (season) {
        q = query(q, where("season", "==", season))
      }

      q = query(q, limit(limitCount))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as AgeTrend[]
    } catch (error) {
      console.error("Error getting age trends:", error)
      return []
    }
  }

  static async getAgeTrendById(trendId: string): Promise<AgeTrend | null> {
    try {
      const docRef = doc(db, "ageTrends", trendId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt.toDate(),
          updatedAt: docSnap.data().updatedAt.toDate(),
        } as AgeTrend
      }

      return null
    } catch (error) {
      console.error("Error getting age trend:", error)
      return null
    }
  }

  static async createAgeTrend(trend: Omit<AgeTrend, "id" | "createdAt" | "updatedAt">) {
    try {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(db, "ageTrends"), {
        ...trend,
        createdAt: now,
        updatedAt: now,
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating age trend:", error)
      throw error
    }
  }

  static async updateAgeTrend(trendId: string, updates: Partial<AgeTrend>) {
    try {
      const docRef = doc(db, "ageTrends", trendId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error("Error updating age trend:", error)
      throw error
    }
  }

  // 연령대별 추천 관리
  static async getAgeGroupRecommendations(
    ageGroup?: "20s" | "30s" | "40s" | "50s" | "60s",
  ): Promise<AgeGroupRecommendation[]> {
    try {
      let q = query(collection(db, "ageGroupRecommendations"), orderBy("updatedAt", "desc"))

      if (ageGroup) {
        q = query(q, where("ageGroup", "==", ageGroup))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as AgeGroupRecommendation[]
    } catch (error) {
      console.error("Error getting age group recommendations:", error)
      return []
    }
  }

  static async getAgeGroupRecommendationById(recommendationId: string): Promise<AgeGroupRecommendation | null> {
    try {
      const docRef = doc(db, "ageGroupRecommendations", recommendationId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt.toDate(),
          updatedAt: docSnap.data().updatedAt.toDate(),
        } as AgeGroupRecommendation
      }

      return null
    } catch (error) {
      console.error("Error getting age group recommendation:", error)
      return null
    }
  }

  static async createAgeGroupRecommendation(
    recommendation: Omit<AgeGroupRecommendation, "id" | "createdAt" | "updatedAt">,
  ) {
    try {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(db, "ageGroupRecommendations"), {
        ...recommendation,
        createdAt: now,
        updatedAt: now,
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating age group recommendation:", error)
      throw error
    }
  }

  static async updateAgeGroupRecommendation(recommendationId: string, updates: Partial<AgeGroupRecommendation>) {
    try {
      const docRef = doc(db, "ageGroupRecommendations", recommendationId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error("Error updating age group recommendation:", error)
      throw error
    }
  }

  // 샘플 데이터 생성 (개발용)
  static async generateSampleAgeTrends() {
    try {
      const currentYear = new Date().getFullYear()
      const currentSeason = this.getCurrentSeason()

      const ageTrendSamples: Omit<AgeTrend, "id" | "createdAt" | "updatedAt">[] = [
        {
          ageGroup: "20s",
          year: currentYear,
          season: currentSeason,
          trends: {
            skincare: {
              popularCategories: ["미니멀 스킨케어", "각질 케어", "수분 부스팅", "선케어"],
              popularIngredients: ["히알루론산", "나이아신아마이드", "AHA/BHA", "비타민C"],
              concerns: ["여드름", "모공", "피지 조절", "수분 부족"],
              routineComplexity: "moderate",
            },
            makeup: {
              colorPalette: ["코랄", "핑크", "피치", "라벤더", "민트"],
              finishType: ["dewy", "glossy", "natural"],
              focusAreas: ["eyes", "lips", "cheeks"],
              intensity: "moderate",
            },
            hairStyle: {
              popularStyles: ["레이어드 컷", "히피 펌", "볼륨 웨이브", "단발머리", "애쉬 컬러"],
              popularColors: ["애쉬 브라운", "밀크 브라운", "로즈 골드", "블루 블랙"],
              lengthTrend: "medium",
              texturePreference: ["wavy", "straight"],
            },
            fashion: {
              styles: ["Y2K", "스트릿웨어", "아메카지", "페미닌 캐주얼", "고프코어"],
              colors: ["네온", "파스텔", "뉴트럴", "컬러 블록"],
              keyItems: ["크롭탑", "와이드 팬츠", "오버사이즈 셔츠", "플리스 자켓", "미니스커트"],
              accessories: ["버킷햇", "초커", "레이어드 네크리스", "헤어 클립", "토트백"],
            },
            footwear: {
              styles: ["청키 스니커즈", "플랫폼 샌들", "로퍼", "컴뱃 부츠", "스포츠 샌들"],
              heelHeights: ["flat", "medium"],
              popularMaterials: ["캔버스", "가죽", "니트", "PVC"],
              seasonalTrends: ["컬러풀 스니커즈", "스트랩 샌들", "메쉬 소재", "투명 디테일"],
            },
          },
        },
        {
          ageGroup: "30s",
          year: currentYear,
          season: currentSeason,
          trends: {
            skincare: {
              popularCategories: ["안티에이징", "브라이트닝", "진정 케어", "안티폴루션"],
              popularIngredients: ["레티놀", "펩타이드", "비타민C", "세라마이드", "콜라겐"],
              concerns: ["잔주름", "피부 톤", "모공", "탄력 저하"],
              routineComplexity: "extensive",
            },
            makeup: {
              colorPalette: ["누드", "브라운", "로즈", "버건디", "테라코타"],
              finishType: ["satin", "natural", "dewy"],
              focusAreas: ["brows", "eyes", "contour"],
              intensity: "moderate",
            },
            hairStyle: {
              popularStyles: ["레이어드 미디엄", "C컬 웨이브", "사이드 파팅", "볼륨 레이어"],
              popularColors: ["다크 브라운", "초콜릿", "캐러멜 발레아쥬", "내추럴 블랙"],
              lengthTrend: "medium",
              texturePreference: ["wavy", "straight"],
            },
            fashion: {
              styles: ["모던 미니멀", "스마트 캐주얼", "페미닌 시크", "컨템포러리 베이직"],
              colors: ["뉴트럴", "어스 톤", "모노크롬", "소프트 컬러"],
              keyItems: ["트렌치코트", "테일러드 자켓", "슬림 팬츠", "니트 원피스", "실크 블라우스"],
              accessories: ["구조적인 백", "스테이트먼트 이어링", "가는 레이어드 목걸이", "스카프"],
            },
            footwear: {
              styles: ["앵클 부츠", "스트랩 힐", "포인티드 플랫", "로퍼", "미니멀 스니커즈"],
              heelHeights: ["low", "medium"],
              popularMaterials: ["가죽", "스웨이드", "패브릭"],
              seasonalTrends: ["스퀘어 토", "메탈릭 디테일", "동물 무늬", "컬러 블록"],
            },
          },
        },
        {
          ageGroup: "40s",
          year: currentYear,
          season: currentSeason,
          trends: {
            skincare: {
              popularCategories: ["안티에이징", "탄력 케어", "브라이트닝", "보습"],
              popularIngredients: ["레티놀", "펩타이드", "히알루론산", "비타민C", "EGF"],
              concerns: ["주름", "탄력", "건조함", "색소침착"],
              routineComplexity: "extensive",
            },
            makeup: {
              colorPalette: ["소프트 브라운", "로즈", "플럼", "모브", "소프트 코랄"],
              finishType: ["satin", "natural"],
              focusAreas: ["brows", "eyes", "cheeks"],
              intensity: "moderate",
            },
            hairStyle: {
              popularStyles: ["레이어드 밥", "내추럴 웨이브", "사이드 스윕 뱅", "볼륨 레이어"],
              popularColors: ["다크 브라운", "소프트 블랙", "하이라이트", "커버 그레이"],
              lengthTrend: "medium",
              texturePreference: ["straight", "wavy"],
            },
            fashion: {
              styles: ["클래식 모던", "소피스티케이티드", "비즈니스 캐주얼", "엘레강스"],
              colors: ["뉴트럴", "네이비", "버건디", "올리브", "카멜"],
              keyItems: ["테일러드 자켓", "실크 블라우스", "스트레이트 팬츠", "랩 드레스", "트렌치코트"],
              accessories: ["구조적인 백", "진주 주얼리", "실크 스카프", "가죽 벨트"],
            },
            footwear: {
              styles: ["블록 힐", "로퍼", "앵클 부츠", "포인티드 플랫", "스트랩 샌들"],
              heelHeights: ["low", "medium"],
              popularMaterials: ["가죽", "스웨이드", "패브릭"],
              seasonalTrends: ["컴포트 디자인", "클래식 컬러", "메탈릭 디테일"],
            },
          },
        },
        {
          ageGroup: "50s",
          year: currentYear,
          season: currentSeason,
          trends: {
            skincare: {
              popularCategories: ["안티에이징", "리프팅", "보습", "브라이트닝"],
              popularIngredients: ["레티놀", "펩타이드", "세라마이드", "히알루론산", "항산화제"],
              concerns: ["주름", "탄력 저하", "건조함", "피부 처짐"],
              routineComplexity: "moderate",
            },
            makeup: {
              colorPalette: ["소프트 브라운", "모브", "로즈", "소프트 코랄", "베이지"],
              finishType: ["satin", "natural"],
              focusAreas: ["brows", "cheeks", "lips"],
              intensity: "subtle",
            },
            hairStyle: {
              popularStyles: ["소프트 레이어", "볼륨 밥", "페이스 프레이밍 컷", "내추럴 웨이브"],
              popularColors: ["소프트 브라운", "하이라이트", "실버 블렌드", "내추럴 그레이"],
              lengthTrend: "medium",
              texturePreference: ["straight", "wavy"],
            },
            fashion: {
              styles: ["클래식 엘레강스", "소피스티케이티드", "모던 클래식", "컨템포러리"],
              colors: ["네이비", "베이지", "버건디", "에메랄드", "소프트 화이트"],
              keyItems: ["테일러드 자켓", "실크 블라우스", "스트레이트 팬츠", "니트 카디건", "시프트 드레스"],
              accessories: ["구조적인 백", "진주 주얼리", "실크 스카프", "클래식 워치"],
            },
            footwear: {
              styles: ["로우 힐", "로퍼", "발레 플랫", "앵클 부츠", "스트랩 샌들"],
              heelHeights: ["low"],
              popularMaterials: ["가죽", "스웨이드"],
              seasonalTrends: ["컴포트 디자인", "클래식 컬러", "쿠션 인솔"],
            },
          },
        },
        {
          ageGroup: "60s",
          year: currentYear,
          season: currentSeason,
          trends: {
            skincare: {
              popularCategories: ["안티에이징", "보습", "진정", "리프팅"],
              popularIngredients: ["레티놀", "펩타이드", "세라마이드", "히알루론산", "항산화제"],
              concerns: ["건조함", "탄력 저하", "민감성", "피부 처짐"],
              routineComplexity: "minimal",
            },
            makeup: {
              colorPalette: ["소프트 핑크", "베이지", "소프트 브라운", "모브", "플럼"],
              finishType: ["satin", "natural"],
              focusAreas: ["cheeks", "lips", "brows"],
              intensity: "subtle",
            },
            hairStyle: {
              popularStyles: ["소프트 레이어", "볼륨 숏컷", "클래식 밥", "내추럴 웨이브"],
              popularColors: ["실버", "소프트 화이트", "내추럴 그레이", "소프트 블론드"],
              lengthTrend: "short",
              texturePreference: ["straight", "wavy"],
            },
            fashion: {
              styles: ["클래식 엘레강스", "타임리스", "소피스티케이티드", "컴포트 시크"],
              colors: ["네이비", "베이지", "크림", "소프트 블루", "버건디"],
              keyItems: ["테일러드 자켓", "니트 세트", "스트레이트 팬츠", "실크 블라우스", "랩 드레스"],
              accessories: ["클래식 백", "진주 주얼리", "실크 스카프", "클래식 워치"],
            },
            footwear: {
              styles: ["로우 힐", "로퍼", "발레 플랫", "컴포트 샌들", "워킹 슈즈"],
              heelHeights: ["flat", "low"],
              popularMaterials: ["소프트 가죽", "스웨이드"],
              seasonalTrends: ["컴포트 디자인", "쿠션 인솔", "넓은 발볼"],
            },
          },
        },
      ]

      for (const trend of ageTrendSamples) {
        await this.createAgeTrend(trend)
      }

      console.log(`${ageTrendSamples.length} sample age trends created`)
    } catch (error) {
      console.error("Error generating sample age trends:", error)
    }
  }

  static async generateSampleAgeGroupRecommendations() {
    try {
      const ageGroupRecommendationSamples: Omit<AgeGroupRecommendation, "id" | "createdAt" | "updatedAt">[] = [
        {
          ageGroup: "20s",
          title: "20대를 위한 뷰티 가이드",
          description: "활력 넘치는 20대를 위한 트렌디하고 건강한 뷰티 스타일 가이드입니다.",
          skincare: {
            recommendedCategories: ["수분 공급", "각질 케어", "여드름 케어", "선케어"],
            keyIngredients: ["히알루론산", "나이아신아마이드", "살리실산", "비타민C", "티트리"],
            avoidIngredients: ["과도한 알코올", "강한 향료", "미네랄 오일"],
            routineTips: [
              "기초 스킨케어에 집중하세요",
              "자외선 차단제는 필수입니다",
              "과도한 각질 제거는 피부 장벽을 약화시킬 수 있어요",
              "수분 공급에 신경 쓰세요",
            ],
            productTypes: ["젤 타입 보습제", "가벼운 텍스처의 세럼", "클레이 마스크", "포밍 클렌저"],
          },
          makeup: {
            recommendedProducts: ["틴티드 모이스처라이저", "크림 블러셔", "마스카라", "틴트", "컬러 아이라이너"],
            techniques: ["내추럴 글로우 메이크업", "그라데이션 립", "컬러 포인트 아이메이크업"],
            colorRecommendations: ["코랄", "핑크", "피치", "라벤더", "민트"],
            applicationTips: [
              "과도한 파운데이션보다 부분 커버에 집중하세요",
              "크림 타입 제품으로 자연스러운 윤기를 표현하세요",
              "트렌디한 컬러로 포인트를 주세요",
            ],
          },
          hairCare: {
            recommendedStyles: ["레이어드 컷", "히피 펌", "볼륨 웨이브", "단발머리", "애쉬 컬러"],
            careRoutine: ["주 1-2회 트리트먼트 사용하기", "열 스타일링 전 열 보호제 사용하기", "두피 건강에 신경 쓰기"],
            colorAdvice: [
              "트렌디한 애쉬 톤 시도해보기",
              "밝은 컬러는 데미지가 심하니 정기적인 케어 필요",
              "그라데이션 염색으로 자연스러운 변화 주기",
            ],
            commonIssues: ["염색 후 손상", "열 스타일링으로 인한 갈라짐", "두피 트러블"],
            solutions: [
              "단백질 트리트먼트 사용하기",
              "실리콘 프리 샴푸 사용해보기",
              "주기적인 트리밍으로 끝이 갈라지는 것 방지하기",
            ],
          },
          fashion: {
            styleGuide: [
              "트렌드를 적극적으로 반영하되 자신만의 스타일 찾기",
              "다양한 레이어링으로 개성 표현하기",
              "베이직 아이템과 트렌디한 아이템 믹스 매치하기",
            ],
            essentialItems: ["오버사이즈 셔츠", "와이드 팬츠", "크롭탑", "데님 자켓", "미니스커트"],
            colorPalette: ["네온", "파스텔", "뉴트럴", "컬러 블록"],
            occasionSpecific: {
              casual: ["오버사이즈 티셔츠", "와이드 팬츠", "크롭탑", "후드티"],
              workwear: ["테일러드 자켓", "슬림 팬츠", "블라우스", "미디 스커트"],
              formal: ["미니 드레스", "점프수트", "테일러드 수트", "새틴 탑"],
            },
          },
          footwear: {
            recommendedTypes: ["청키 스니커즈", "플랫폼 샌들", "로퍼", "컴뱃 부츠", "스포츠 샌들"],
            comfortTips: [
              "장시간 착용할 신발은 쿠션감 확인하기",
              "발볼이 좁은 신발은 피하기",
              "다양한 굽 높이의 신발 구비하기",
            ],
            styleTips: [
              "스니커즈는 다양한 스타일링에 활용도가 높아요",
              "특별한 날에는 스테이트먼트 슈즈로 포인트 주기",
              "시즌별로 다른 스타일 시도해보기",
            ],
            seasonalRecommendations: {
              spring: ["로퍼", "스니커즈", "메리제인", "앵클 부츠"],
              summer: ["스트랩 샌들", "에스파드리유", "슬라이드", "메쉬 스니커즈"],
              fall: ["앵클 부츠", "로퍼", "첼시 부츠", "스웨이드 슈즈"],
              winter: ["롱 부츠", "청키 부츠", "방한 스니커즈", "퍼 디테일 슈즈"],
            },
          },
        },
        {
          ageGroup: "30s",
          title: "30대를 위한 뷰티 가이드",
          description: "균형 잡힌 라이프스타일과 프로페셔널한 이미지를 위한 30대 맞춤 뷰티 가이드입니다.",
          skincare: {
            recommendedCategories: ["안티에이징", "브라이트닝", "진정 케어", "안티폴루션"],
            keyIngredients: ["레티놀", "펩타이드", "비타민C", "세라마이드", "히알루론산"],
            avoidIngredients: ["강한 알코올", "합성 향료", "미네랄 오일", "파라벤"],
            routineTips: [
              "나이트 케어에 집중하세요",
              "항산화 성분이 함유된 제품을 사용하세요",
              "정기적인 각질 제거로 피부 턴오버를 촉진하세요",
              "아이크림을 꾸준히 사용하세요",
            ],
            productTypes: ["세럼", "아이크림", "에센스", "시트 마스크", "선크림"],
          },
          makeup: {
            recommendedProducts: ["리퀴드 파운데이션", "크림 블러셔", "아이브로우 제품", "립스틱", "아이섀도우 팔레트"],
            techniques: ["내추럴 글램 메이크업", "소프트 스모키", "그라데이션 립"],
            colorRecommendations: ["누드", "브라운", "로즈", "버건디", "테라코타"],
            applicationTips: [
              "피부 톤을 균일하게 보정하는 데 집중하세요",
              "과도한 하이라이터보다 자연스러운 광택을 표현하세요",
              "아이브로우 메이크업으로 얼굴의 균형을 잡아주세요",
            ],
          },
          hairCare: {
            recommendedStyles: ["레이어드 미디엄", "C컬 웨이브", "사이드 파팅", "볼륨 레이어"],
            careRoutine: [
              "주 1-2회 딥 컨디셔닝 트리트먼트 사용하기",
              "열 스타일링 전 열 보호제 사용하기",
              "두피 마사지로 혈액순환 촉진하기",
            ],
            colorAdvice: [
              "자연스러운 하이라이트로 입체감 주기",
              "새치 커버를 위한 염색은 저자극 제품 선택하기",
              "톤 다운된 컬러로 세련된 이미지 연출하기",
            ],
            commonIssues: ["새치", "모발 얇아짐", "건조함", "윤기 부족"],
            solutions: [
              "두피 케어 제품 사용하기",
              "단백질과 수분 밸런스 맞춘 케어하기",
              "실리콘 오일 함유 제품으로 윤기 더하기",
            ],
          },
          fashion: {
            styleGuide: [
              "베이직한 아이템에 트렌디한 액세서리 매치하기",
              "체형에 맞는 실루엣 찾기",
              "소재의 퀄리티에 투자하기",
            ],
            essentialItems: ["트렌치코트", "테일러드 자켓", "슬림 팬츠", "니트 원피스", "실크 블라우스"],
            colorPalette: ["뉴트럴", "어스 톤", "모노크롬", "소프트 컬러"],
            occasionSpecific: {
              casual: ["프리미엄 데님", "니트 탑", "셔츠 원피스", "트렌치코트"],
              workwear: ["테일러드 수트", "펜슬 스커트", "실크 블라우스", "니트 탑"],
              formal: ["칵테일 드레스", "점프수트", "테일러드 수트", "실크 탑"],
            },
          },
          footwear: {
            recommendedTypes: ["앵클 부츠", "스트랩 힐", "포인티드 플랫", "로퍼", "미니멀 스니커즈"],
            comfortTips: [
              "쿠션감 있는 인솔 사용하기",
              "하루 종일 신을 신발은 낮은 굽 선택하기",
              "발에 맞는 사이즈 선택하기",
            ],
            styleTips: [
              "베이직한 디자인에 투자하기",
              "다양한 스타일링이 가능한 컬러 선택하기",
              "계절별로 다른 소재 시도하기",
            ],
            seasonalRecommendations: {
              spring: ["로퍼", "스웨이드 플랫", "앵클 부츠", "미드힐"],
              summer: ["스트랩 샌들", "에스파드리유", "슬링백", "메쉬 플랫"],
              fall: ["앵클 부츠", "로퍼", "블록힐", "스웨이드 슈즈"],
              winter: ["롱 부츠", "첼시 부츠", "방한 플랫", "스웨이드 부츠"],
            },
          },
        },
        {
          ageGroup: "40s",
          title: "40대를 위한 뷰티 가이드",
          description: "우아함과 자신감이 돋보이는 40대를 위한 맞춤형 뷰티 가이드입니다.",
          skincare: {
            recommendedCategories: ["안티에이징", "탄력 케어", "브라이트닝", "보습"],
            keyIngredients: ["레티놀", "펩타이드", "히알루론산", "비타민C", "EGF", "세라마이드"],
            avoidIngredients: ["알코올", "합성 향료", "미네랄 오일", "파라벤"],
            routineTips: [
              "저녁 스킨케어에 더 많은 시간을 투자하세요",
              "목과 데콜테 부위도 함께 케어하세요",
              "각질 제거는 부드럽게, 주 1-2회만 하세요",
              "보습에 집중하세요",
            ],
            productTypes: ["리치 크림", "페이셜 오일", "앰플", "아이크림", "넥크림"],
          },
          makeup: {
            recommendedProducts: ["리퀴드 파운데이션", "크림 블러셔", "아이브로우 제품", "립스틱", "컨실러"],
            techniques: ["내추럴 글로우 메이크업", "소프트 디파인드 아이", "크림 블러셔 활용"],
            colorRecommendations: ["소프트 브라운", "로즈", "플럼", "모브", "소프트 코랄"],
            applicationTips: [
              "무거운 파운데이션보다 얇게 여러 번 덧바르는 방식을 시도하세요",
              "크림 타입 제품으로 자연스러운 윤기를 표현하세요",
              "아이브로우와 입술에 신경 쓰면 얼굴이 생기 있어 보입니다",
            ],
          },
          hairCare: {
            recommendedStyles: ["레이어드 밥", "내추럴 웨이브", "사이드 스윕 뱅", "볼륨 레이어"],
            careRoutine: [
              "주 2회 집중 트리트먼트 사용하기",
              "두피 케어 제품 정기적으로 사용하기",
              "오일 트리트먼트로 윤기 더하기",
            ],
            colorAdvice: [
              "새치 커버는 자연스러운 톤 선택하기",
              "얼굴 주변에 밝은 하이라이트로 얼굴 밝히기",
              "전체적으로 너무 어두운 컬러는 피하기",
            ],
            commonIssues: ["새치", "모발 얇아짐", "건조함", "탄력 부족"],
            solutions: [
              "두피 영양 공급 제품 사용하기",
              "볼륨 케어 제품 활용하기",
              "정기적인 트리밍으로 모발 건강 유지하기",
            ],
          },
          fashion: {
            styleGuide: [
              "체형을 고려한 실루엣 선택하기",
              "고급스러운 소재와 디테일에 투자하기",
              "과한 트렌드보다 클래식한 스타일에 포인트 주기",
            ],
            essentialItems: ["테일러드 자켓", "실크 블라우스", "스트레이트 팬츠", "랩 드레스", "트렌치코트"],
            colorPalette: ["뉴트럴", "네이비", "버건디", "올리브", "카멜"],
            occasionSpecific: {
              casual: ["프리미엄 데님", "캐시미어 니트", "셔츠 원피스", "트렌치코트"],
              workwear: ["테일러드 수트", "펜슬 스커트", "실크 블라우스", "니트 드레스"],
              formal: ["칵테일 드레스", "이브닝 수트", "실크 탑 세트", "시프트 드레스"],
            },
          },
          footwear: {
            recommendedTypes: ["블록 힐", "로퍼", "앵클 부츠", "포인티드 플랫", "스트랩 샌들"],
            comfortTips: ["쿠션감 있는 인솔 사용하기", "발에 맞는 사이즈 선택하기", "너무 좁은 앞코 디자인은 피하기"],
            styleTips: [
              "클래식한 디자인에 투자하기",
              "다양한 스타일링이 가능한 컬러 선택하기",
              "고급스러운 소재와 디테일 확인하기",
            ],
            seasonalRecommendations: {
              spring: ["로퍼", "스웨이드 플랫", "앵클 부츠", "미드힐"],
              summer: ["스트랩 샌들", "슬링백", "에스파드리유", "오픈토 플랫"],
              fall: ["앵클 부츠", "로퍼", "블록힐", "스웨이드 슈즈"],
              winter: ["미드 부츠", "첼시 부츠", "방한 플랫", "스웨이드 부츠"],
            },
          },
        },
        {
          ageGroup: "50s",
          title: "50대를 위한 뷰티 가이드",
          description: "우아함과 세련미가 돋보이는 50대를 위한 맞춤형 뷰티 가이드입니다.",
          skincare: {
            recommendedCategories: ["안티에이징", "리프팅", "보습", "브라이트닝"],
            keyIngredients: ["레티놀", "펩타이드", "세라마이드", "히알루론산", "항산화제", "줄기세포 추출물"],
            avoidIngredients: ["알코올", "합성 향료", "미네랄 오일", "파라벤"],
            routineTips: [
              "부드러운 클렌징으로 피부 자극 최소화하기",
              "영양 크림을 충분히 사용하기",
              "목과 데콜테, 손까지 함께 케어하기",
              "자외선 차단제 꼭 사용하기",
            ],
            productTypes: ["리치 크림", "페이셜 오일", "앰플", "아이크림", "넥크림", "핸드크림"],
          },
          makeup: {
            recommendedProducts: ["리퀴드 파운데이션", "크림 블러셔", "아이브로우 제품", "립스틱", "컨실러"],
            techniques: ["내추럴 글로우 메이크업", "소프트 아이 메이크업", "크림 블러셔 활용"],
            colorRecommendations: ["소프트 브라운", "모브", "로즈", "소프트 코랄", "베이지"],
            applicationTips: [
              "가벼운 레이어링으로 자연스러운 커버력 만들기",
              "크림 타입 제품으로 건조함 방지하기",
              "아이브로우와 블러셔로 얼굴에 생기 주기",
            ],
          },
          hairCare: {
            recommendedStyles: ["소프트 레이어", "볼륨 밥", "페이스 프레이밍 컷", "내추럴 웨이브"],
            careRoutine: [
              "주 2회 집중 트리트먼트 사용하기",
              "두피 케어 제품 정기적으로 사용하기",
              "오일 트리트먼트로 윤기 더하기",
            ],
            colorAdvice: [
              "새치 커버는 자연스러운 톤 선택하기",
              "얼굴 주변에 밝은 하이라이트로 얼굴 밝히기",
              "전체적으로 너무 어두운 컬러는 피하기",
            ],
            commonIssues: ["새치", "모발 얇아짐", "건조함", "탄력 부족"],
            solutions: [
              "두피 영양 공급 제품 사용하기",
              "볼륨 케어 제품 활용하기",
              "정기적인 트리밍으로 모발 건강 유지하기",
            ],
          },
          fashion: {
            styleGuide: [
              "체형을 고려한 실루엣 선택하기",
              "고급스러운 소재와 디테일에 투자하기",
              "과한 트렌드보다 클래식한 스타일에 포인트 주기",
            ],
            essentialItems: ["테일러드 자켓", "실크 블라우스", "스트레이트 팬츠", "니트 카디건", "시프트 드레스"],
            colorPalette: ["네이비", "베이지", "버건디", "에메랄드", "소프트 화이트"],
            occasionSpecific: {
              casual: ["프리미엄 데님", "캐시미어 니트", "셔츠 원피스", "트렌치코트"],
              workwear: ["테일러드 수트", "펜슬 스커트", "실크 블라우스", "니트 드레스"],
              formal: ["칵테일 드레스", "이브닝 수트", "실크 앙상블", "시프트 드레스"],
            },
          },
          footwear: {
            recommendedTypes: ["로우 힐", "로퍼", "발레 플랫", "앵클 부츠", "스트랩 샌들"],
            comfortTips: ["쿠션감 있는 인솔 사용하기", "발에 맞는 사이즈 선택하기", "너무 좁은 앞코 디자인은 피하기"],
            styleTips: [
              "클래식한 디자인에 투자하기",
              "다양한 스타일링이 가능한 컬러 선택하기",
              "고급스러운 소재와 디테일 확인하기",
            ],
            seasonalRecommendations: {
              spring: ["로퍼", "스웨이드 플랫", "앵클 부츠", "로우힐"],
              summer: ["스트랩 샌들", "슬링백", "에스파드리유", "오픈토 플랫"],
              fall: ["앵클 부츠", "로퍼", "로우힐", "스웨이드 슈즈"],
              winter: ["미드 부츠", "첼시 부츠", "방한 플랫", "스웨이드 부츠"],
            },
          },
        },
        {
          ageGroup: "60s",
          title: "60대를 위한 뷰티 가이드",
          description: "품격 있는 아름다움을 위한 60대 맞춤형 뷰티 가이드입니다.",
          skincare: {
            recommendedCategories: ["안티에이징", "보습", "진정", "리프팅"],
            keyIngredients: ["레티놀", "펩타이드", "세라마이드", "히알루론산", "항산화제", "줄기세포 추출물"],
            avoidIngredients: ["알코올", "합성 향료", "미네랄 오일", "파라벤"],
            routineTips: [
              "부드러운 클렌징으로 피부 자극 최소화하기",
              "영양 크림을 충분히 사용하기",
              "목과 데콜테, 손까지 함께 케어하기",
              "자외선 차단제 꼭 사용하기",
            ],
            productTypes: ["리치 크림", "페이셜 오일", "앰플", "아이크림", "넥크림", "핸드크림"],
          },
          makeup: {
            recommendedProducts: ["리퀴드 파운데이션", "크림 블러셔", "아이브로우 제품", "립스틱", "컨실러"],
            techniques: ["내추럴 글로우 메이크업", "소프트 아이 메이크업", "크림 블러셔 활용"],
            colorRecommendations: ["소프트 핑크", "베이지", "소프트 브라운", "모브", "플럼"],
            applicationTips: [
              "가벼운 레이어링으로 자연스러운 커버력 만들기",
              "크림 타입 제품으로 건조함 방지하기",
              "블러셔와 립 컬러로 얼굴에 생기 주기",
            ],
          },
          hairCare: {
            recommendedStyles: ["소프트 레이어", "볼륨 숏컷", "클래식 밥", "내추럴 웨이브"],
            careRoutine: [
              "주 2회 집중 트리트먼트 사용하기",
              "두피 케어 제품 정기적으로 사용하기",
              "오일 트리트먼트로 윤기 더하기",
            ],
            colorAdvice: [
              "자연스러운 실버 톤 활용하기",
              "얼굴 주변에 밝은 하이라이트로 얼굴 밝히기",
              "부드러운 컬러로 자연스러움 강조하기",
            ],
            commonIssues: ["모발 얇아짐", "건조함", "탄력 부족", "색상 유지"],
            solutions: ["두피 영양 공급 제품 사용하기", "볼륨 케어 제품 활용하기", "저자극 컬러 제품 선택하기"],
          },
          fashion: {
            styleGuide: [
              "체형을 고려한 실루엣 선택하기",
              "고급스러운 소재와 디테일에 투자하기",
              "편안함과 스타일을 모두 고려하기",
            ],
            essentialItems: ["테일러드 자켓", "니트 세트", "스트레이트 팬츠", "실크 블라우스", "랩 드레스"],
            colorPalette: ["네이비", "베이지", "크림", "소프트 블루", "버건디"],
            occasionSpecific: {
              casual: ["프리미엄 니트", "캐시미어 카디건", "편안한 팬츠", "셔츠 원피스"],
              workwear: ["테일러드 자켓", "편안한 스커트", "실크 블라우스", "니트 앙상블"],
              formal: ["우아한 드레스", "앙상블 세트", "실크 블라우스와 팬츠", "재킷 세트"],
            },
          },
          footwear: {
            recommendedTypes: ["로우 힐", "로퍼", "발레 플랫", "컴포트 샌들", "워킹 슈즈"],
            comfortTips: ["쿠션감 있는 인솔 사용하기", "발에 맞는 사이즈 선택하기", "너무 좁은 앞코 디자인은 피하기"],
            styleTips: [
              "클래식한 디자인에 투자하기",
              "다양한 스타일링이 가능한 컬러 선택하기",
              "편안함과 스타일을 모두 갖춘 제품 선택하기",
            ],
            seasonalRecommendations: {
              spring: ["로퍼", "컴포트 플랫", "워킹 슈즈", "로우힐"],
              summer: ["컴포트 샌들", "슬립온", "에어 쿠션 슈즈", "오픈토 플랫"],
              fall: ["로퍼", "컴포트 부츠", "워킹 슈즈", "스웨이드 플랫"],
              winter: ["방한 플랫", "컴포트 부츠", "방한 워킹화", "부드러운 소재 슈즈"],
            },
          },
        },
      ]

      for (const recommendation of ageGroupRecommendationSamples) {
        await this.createAgeGroupRecommendation(recommendation)
      }

      console.log(`${ageGroupRecommendationSamples.length} sample age group recommendations created`)
    } catch (error) {
      console.error("Error generating sample age group recommendations:", error)
    }
  }

  private static getCurrentSeason(): "spring" | "summer" | "fall" | "winter" {
    const month = new Date().getMonth()
    if (month >= 2 && month <= 4) return "spring"
    if (month >= 5 && month <= 7) return "summer"
    if (month >= 8 && month <= 10) return "fall"
    return "winter"
  }
}
