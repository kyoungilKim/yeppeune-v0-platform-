"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductService } from "@/lib/firebase-product"
import type { BeautyProduct, ProductReview } from "@/types/product"
import { Star, ShoppingCart, Heart, Share2, ArrowLeft, Package, Truck, Shield, Users, ThumbsUp } from "lucide-react"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<BeautyProduct | null>(null)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: "",
    content: "",
  })

  // 임시 사용자 정보
  const currentUser = {
    id: "user123",
    name: "김예쁘",
    avatar: "/placeholder.svg?height=40&width=40",
  }

  useEffect(() => {
    if (params.id) {
      loadProductData(params.id as string)
    }
  }, [params.id])

  const loadProductData = async (productId: string) => {
    try {
      setLoading(true)

      // 제품 정보 로드
      const productData = await ProductService.getProductById(productId)
      if (!productData) {
        router.push("/products")
        return
      }
      setProduct(productData)

      // 리뷰 로드
      const reviewsData = await ProductService.getProductReviews(productId)
      setReviews(reviewsData)
    } catch (error) {
      console.error("Error loading product data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return

    try {
      await ProductService.addToCart(currentUser.id, product, quantity)
      alert(`${product.name}이(가) 장바구니에 추가되었습니다.`)
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  }

  const handleAddReview = async () => {
    if (!product || !newReview.title.trim() || !newReview.content.trim()) return

    try {
      await ProductService.addProductReview({
        productId: product.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        rating: newReview.rating,
        title: newReview.title,
        content: newReview.content,
        images: [],
        helpfulCount: 0,
        verifiedPurchase: false,
      })

      // 리뷰 목록 새로고침
      const updatedReviews = await ProductService.getProductReviews(product.id)
      setReviews(updatedReviews)

      // 폼 초기화
      setNewReview({
        rating: 5,
        title: "",
        content: "",
      })

      alert("리뷰가 등록되었습니다!")
    } catch (error) {
      console.error("Error adding review:", error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">제품 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">제품을 찾을 수 없습니다</h2>
          <Button onClick={() => router.push("/products")}>제품 목록으로 돌아가기</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* 뒤로가기 버튼 */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        뒤로가기
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 제품 이미지 */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={product.images[selectedImage] || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? "border-pink-500" : "border-gray-200"
                  }`}
                >
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 제품 정보 */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{product.brand}</Badge>
              {product.isNew && <Badge className="bg-pink-500">NEW</Badge>}
              {product.bestSeller && <Badge className="bg-amber-500">BEST</Badge>}
            </div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">{product.shortDescription}</p>

            {/* 평점 */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{product.rating}</span>
              <span className="text-gray-500">({product.reviewCount}개 리뷰)</span>
            </div>

            {/* 가격 */}
            <div className="text-3xl font-bold text-pink-600 mb-6">
              {product.price.toLocaleString()}원<span className="text-sm text-gray-500 ml-2">/ {product.size}</span>
            </div>

            {/* 피부 타입 */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">적합한 피부 타입</h3>
              <div className="flex flex-wrap gap-2">
                {product.suitableFor.skinTypes.map((type, index) => (
                  <Badge key={index} variant="secondary">
                    {type === "dry"
                      ? "건성"
                      : type === "oily"
                        ? "지성"
                        : type === "combination"
                          ? "복합성"
                          : type === "sensitive"
                            ? "민감성"
                            : "중성"}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 주요 효능 */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">주요 효능</h3>
              <div className="flex flex-wrap gap-2">
                {product.benefits.map((benefit, index) => (
                  <Badge key={index} variant="outline">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 수량 선택 및 구매 버튼 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="font-semibold">수량:</label>
                <Select value={quantity.toString()} onValueChange={(value) => setQuantity(Number.parseInt(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(10)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleAddToCart} className="flex-1">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  장바구니 담기
                </Button>
                <Button variant="outline" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 배송 정보 */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium">무료배송</p>
                <p className="text-xs text-gray-500">3만원 이상</p>
              </div>
              <div className="text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium">당일발송</p>
                <p className="text-xs text-gray-500">오후 2시 이전</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium">품질보장</p>
                <p className="text-xs text-gray-500">100% 정품</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 정보 탭 */}
      <Tabs defaultValue="description" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="description">상세정보</TabsTrigger>
          <TabsTrigger value="ingredients">성분</TabsTrigger>
          <TabsTrigger value="usage">사용법</TabsTrigger>
          <TabsTrigger value="reviews">리뷰 ({reviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="description">
          <Card>
            <CardHeader>
              <CardTitle>제품 상세정보</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingredients">
          <Card>
            <CardHeader>
              <CardTitle>주요 성분</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span>{ingredient}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>사용법</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{product.howToUse}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="space-y-6">
            {/* 리뷰 작성 */}
            <Card>
              <CardHeader>
                <CardTitle>리뷰 작성</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">평점</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setNewReview({ ...newReview, rating: star })} className="p-1">
                        <Star
                          className={`h-6 w-6 ${
                            star <= newReview.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">제목</label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    placeholder="리뷰 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">내용</label>
                  <Textarea
                    value={newReview.content}
                    onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                    placeholder="제품 사용 후기를 자세히 작성해주세요"
                    rows={4}
                  />
                </div>

                <Button onClick={handleAddReview}>리뷰 등록</Button>
              </CardContent>
            </Card>

            {/* 리뷰 목록 */}
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.userAvatar || "/placeholder.svg"} />
                          <AvatarFallback>{review.userName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{review.userName}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-medium mb-2">{review.title}</h4>
                          <p className="text-gray-700 mb-3">{review.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <button className="flex items-center gap-1 hover:text-gray-700">
                              <ThumbsUp className="h-4 w-4" />
                              도움됨 ({review.helpfulCount})
                            </button>
                            {review.verifiedPurchase && (
                              <Badge variant="outline" className="text-xs">
                                구매 확인
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
