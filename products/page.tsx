"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ProductService } from "@/lib/firebase-product"
import type { BeautyProduct } from "@/types/product"
import { Search, Filter, Star, ShoppingCart, Heart, SlidersHorizontal } from "lucide-react"

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<BeautyProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "all",
    skinType: searchParams.get("skinType") || "all",
    concerns: [] as string[],
    priceRange: { min: 0, max: 100000 },
    brands: [] as string[],
    sortBy: "newest",
  })
  const [showFilters, setShowFilters] = useState(false)

  // 임시 사용자 ID
  const userId = "user123"

  useEffect(() => {
    loadProducts()
    // 샘플 데이터 생성 (개발용, 실제 서비스에서는 제거)
    // ProductService.generateSampleProducts()
  }, [filters.category, filters.sortBy])

  const loadProducts = async () => {
    try {
      setLoading(true)

      // 카테고리 필터링
      const categoryFilter = filters.category !== "all" ? filters.category : undefined
      const skinTypeFilter = filters.skinType !== "all" ? filters.skinType : undefined

      // 제품 로드
      const { products: loadedProducts } = await ProductService.getProducts(50, undefined, {
        category: categoryFilter,
        skinType: skinTypeFilter,
        concerns: filters.concerns.length > 0 ? filters.concerns : undefined,
        priceRange: { min: filters.priceRange.min, max: filters.priceRange.max },
        brands: filters.brands.length > 0 ? filters.brands : undefined,
        sortBy: filters.sortBy as any,
      })

      setProducts(loadedProducts)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProducts()
      return
    }

    try {
      setLoading(true)
      const searchResults = await ProductService.searchProducts(searchQuery)
      setProducts(searchResults)
    } catch (error) {
      console.error("Error searching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (product: BeautyProduct) => {
    try {
      await ProductService.addToCart(userId, product, 1)
      alert(`${product.name}이(가) 장바구니에 추가되었습니다.`)
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">제품을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">뷰티 제품</h1>
        <p className="text-gray-600">당신의 피부에 맞는 최적의 제품을 찾아보세요</p>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="제품 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            필터
          </Button>
          <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
            <SelectTrigger className="w-[180px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">최신순</SelectItem>
              <SelectItem value="price_asc">가격 낮은순</SelectItem>
              <SelectItem value="price_desc">가격 높은순</SelectItem>
              <SelectItem value="rating">평점순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <Tabs
        defaultValue={filters.category}
        value={filters.category}
        onValueChange={(value) => setFilters({ ...filters, category: value })}
        className="mb-8"
      >
        <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="skincare">스킨케어</TabsTrigger>
          <TabsTrigger value="makeup">메이크업</TabsTrigger>
          <TabsTrigger value="haircare">헤어케어</TabsTrigger>
          <TabsTrigger value="bodycare">바디케어</TabsTrigger>
          <TabsTrigger value="fragrance">향수</TabsTrigger>
          <TabsTrigger value="tools">도구</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 필터 사이드바 */}
        {showFilters && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">필터</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="skin-type">
                    <AccordionTrigger>피부 타입</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="skin-all"
                            checked={filters.skinType === "all"}
                            onCheckedChange={() => setFilters({ ...filters, skinType: "all" })}
                          />
                          <label htmlFor="skin-all" className="text-sm">
                            전체
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="skin-dry"
                            checked={filters.skinType === "dry"}
                            onCheckedChange={() => setFilters({ ...filters, skinType: "dry" })}
                          />
                          <label htmlFor="skin-dry" className="text-sm">
                            건성
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="skin-oily"
                            checked={filters.skinType === "oily"}
                            onCheckedChange={() => setFilters({ ...filters, skinType: "oily" })}
                          />
                          <label htmlFor="skin-oily" className="text-sm">
                            지성
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="skin-combination"
                            checked={filters.skinType === "combination"}
                            onCheckedChange={() => setFilters({ ...filters, skinType: "combination" })}
                          />
                          <label htmlFor="skin-combination" className="text-sm">
                            복합성
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="skin-sensitive"
                            checked={filters.skinType === "sensitive"}
                            onCheckedChange={() => setFilters({ ...filters, skinType: "sensitive" })}
                          />
                          <label htmlFor="skin-sensitive" className="text-sm">
                            민감성
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="skin-normal"
                            checked={filters.skinType === "normal"}
                            onCheckedChange={() => setFilters({ ...filters, skinType: "normal" })}
                          />
                          <label htmlFor="skin-normal" className="text-sm">
                            중성
                          </label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="concerns">
                    <AccordionTrigger>피부 고민</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {["건조함", "모공", "주름", "색소침착", "민감성", "여드름", "탄력 저하", "칙칙함"].map(
                          (concern) => (
                            <div key={concern} className="flex items-center space-x-2">
                              <Checkbox
                                id={`concern-${concern}`}
                                checked={filters.concerns.includes(concern)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilters({ ...filters, concerns: [...filters.concerns, concern] })
                                  } else {
                                    setFilters({
                                      ...filters,
                                      concerns: filters.concerns.filter((c) => c !== concern),
                                    })
                                  }
                                }}
                              />
                              <label htmlFor={`concern-${concern}`} className="text-sm">
                                {concern}
                              </label>
                            </div>
                          ),
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="price">
                    <AccordionTrigger>가격대</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <Slider
                          defaultValue={[filters.priceRange.min, filters.priceRange.max]}
                          max={100000}
                          step={1000}
                          onValueChange={(value) =>
                            setFilters({ ...filters, priceRange: { min: value[0], max: value[1] } })
                          }
                        />
                        <div className="flex justify-between text-sm">
                          <span>{filters.priceRange.min.toLocaleString()}원</span>
                          <span>{filters.priceRange.max.toLocaleString()}원</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="brands">
                    <AccordionTrigger>브랜드</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {Array.from(new Set(products.map((p) => p.brand))).map((brand) => (
                          <div key={brand} className="flex items-center space-x-2">
                            <Checkbox
                              id={`brand-${brand}`}
                              checked={filters.brands.includes(brand)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters({ ...filters, brands: [...filters.brands, brand] })
                                } else {
                                  setFilters({
                                    ...filters,
                                    brands: filters.brands.filter((b) => b !== brand),
                                  })
                                }
                              }}
                            />
                            <label htmlFor={`brand-${brand}`} className="text-sm">
                              {brand}
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button className="w-full" onClick={loadProducts}>
                  필터 적용
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 제품 목록 */}
        <div className={`${showFilters ? "lg:col-span-3" : "lg:col-span-4"}`}>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">제품을 찾을 수 없습니다</h3>
              <p className="text-gray-600 mb-4">다른 검색어나 필터를 시도해보세요</p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setFilters({
                    category: "all",
                    skinType: "all",
                    concerns: [],
                    priceRange: { min: 0, max: 100000 },
                    brands: [],
                    sortBy: "newest",
                  })
                  loadProducts()
                }}
              >
                모든 제품 보기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductCard({
  product,
  onAddToCart,
}: {
  product: BeautyProduct
  onAddToCart: (product: BeautyProduct) => void
}) {
  const router = useRouter()

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <img
          src={product.images[0] || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-48 object-cover"
          onClick={() => router.push(`/products/${product.id}`)}
        />
        {product.isNew && <Badge className="absolute top-2 left-2 bg-pink-500">NEW</Badge>}
        {product.bestSeller && <Badge className="absolute top-2 right-2 bg-amber-500">BEST</Badge>}
      </div>
      <CardHeader className="p-4 pb-0">
        <div className="text-sm text-gray-500 mb-1">{product.brand}</div>
        <CardTitle className="text-base font-medium mb-1">{product.name}</CardTitle>
        <div className="flex items-center">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm ml-1">{product.rating}</span>
          <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-gray-600 line-clamp-2 h-10">{product.shortDescription}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {product.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="font-semibold">{product.price.toLocaleString()}원</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => onAddToCart(product)}>
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
