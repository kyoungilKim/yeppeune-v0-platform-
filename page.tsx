import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Sparkles, User, ShoppingBag, Users, Palette } from "lucide-react"

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-pink-600">Yeppeune</h1>
          <p className="text-gray-600">AI 뷰티 플랫폼</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/login">로그인</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">회원가입</Link>
          </Button>
        </div>
      </header>

      <section className="mb-16">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <h2 className="text-4xl font-bold mb-4">
              AI로 분석하는 <span className="text-pink-600">맞춤형 뷰티 솔루션</span>
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              얼굴 분석부터 제품 추천까지, 당신만을 위한 뷰티 여정을 시작하세요.
            </p>
            <div className="flex gap-4">
              <Button size="lg" asChild>
                <Link href="/ai-analysis">
                  <Camera className="mr-2 h-5 w-5" />
                  AI 분석 시작하기
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/products">제품 둘러보기</Link>
              </Button>
            </div>
          </div>
          <div className="flex-1">
            <img src="/placeholder.svg?height=400&width=600" alt="AI 뷰티 분석" className="rounded-lg shadow-lg" />
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">주요 기능</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Camera className="h-10 w-10 text-pink-500 mb-2" />
              <CardTitle>AI 얼굴 분석</CardTitle>
              <CardDescription>얼굴 특징과 피부 상태를 정밀하게 분석합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                얼굴형, 피부톤, 피부 상태 등을 AI가 분석하여 당신의 뷰티 프로필을 생성합니다. 정확한 분석을 통해 맞춤형
                솔루션을 제공합니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="h-10 w-10 text-pink-500 mb-2" />
              <CardTitle>맞춤형 뷰티 추천</CardTitle>
              <CardDescription>당신에게 딱 맞는 제품과 스타일을 추천합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>AI 분석 결과를 바탕으로 메이크업, 스킨케어, 헤어스타일, 패션까지 종합적인 뷰티 솔루션을 제안합니다.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-pink-500 mb-2" />
              <CardTitle>뷰티 커뮤니티</CardTitle>
              <CardDescription>다양한 뷰티 정보와 경험을 공유합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                같은 피부 타입이나 관심사를 가진 사용자들과 소통하며 리뷰, 팁, 노하우를 공유할 수 있는 소셜
                플랫폼입니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">이런 분들께 추천합니다</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4 items-start">
            <div className="bg-pink-100 p-3 rounded-full">
              <Palette className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">나에게 맞는 컬러를 찾고 싶은 분</h3>
              <p className="text-gray-600">
                퍼스널 컬러 분석을 통해 나에게 어울리는 메이크업 컬러와 패션 스타일을 찾아보세요.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-pink-100 p-3 rounded-full">
              <User className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">피부 고민이 있는 분</h3>
              <p className="text-gray-600">
                피부 상태 분석을 통해 당신의 피부 고민에 맞는 스킨케어 솔루션을 제안받으세요.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-pink-100 p-3 rounded-full">
              <ShoppingBag className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">화장품 구매가 어려운 분</h3>
              <p className="text-gray-600">수많은 제품 중에서 나에게 정말 맞는 제품을 AI 추천으로 쉽게 찾아보세요.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-pink-100 p-3 rounded-full">
              <Sparkles className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">새로운 스타일에 도전하고 싶은 분</h3>
              <p className="text-gray-600">
                AI가 분석한 당신의 특징을 바탕으로 새롭지만 잘 어울리는 스타일을 발견해보세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-6">지금 바로 시작하세요</h2>
        <p className="text-xl text-gray-600 mb-8">AI 뷰티 분석으로 당신만의 아름다움을 발견하세요.</p>
        <Button size="lg" asChild>
          <Link href="/signup">무료로 시작하기</Link>
        </Button>
      </section>

      <footer className="border-t pt-8 text-center text-gray-500">
        <p>© 2025 Yeppeune. All rights reserved.</p>
      </footer>
    </div>
  )
}
