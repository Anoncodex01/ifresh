'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  MoreHorizontal,
  Package,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Mock products data
const mockProducts = [
  {
    id: 1,
    name: 'Organic Honey',
    category: 'Natural Products',
    price: 2500,
    stock: 45,
    status: 'active',
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg',
    description: 'Pure organic honey from local beekeepers',
    createdAt: '2025-01-20',
  },
  {
    id: 2,
    name: 'Fresh Avocados',
    category: 'Fruits',
    price: 1500,
    stock: 23,
    status: 'active',
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.18 (1).jpeg',
    description: 'Fresh organic avocados from Meru',
    createdAt: '2025-01-19',
  },
  {
    id: 3,
    name: 'Coconut Oil',
    category: 'Natural Products',
    price: 3000,
    stock: 0,
    status: 'out_of_stock',
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.18 (2).jpeg',
    description: 'Cold-pressed virgin coconut oil',
    createdAt: '2025-01-18',
  },
  {
    id: 4,
    name: 'Baobab Powder',
    category: 'Superfoods',
    price: 2500,
    stock: 12,
    status: 'low_stock',
    image: '/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg',
    description: 'Nutrient-rich baobab fruit powder',
    createdAt: '2025-01-17',
  },
];

const categories = ['All', 'Beard', 'Skin', 'Hair', 'Saloon solutions'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'out_of_stock':
      return 'bg-red-100 text-red-800';
    case 'low_stock':
      return 'bg-yellow-100 text-yellow-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'out_of_stock':
      return 'Out of Stock';
    case 'low_stock':
      return 'Low Stock';
    case 'inactive':
      return 'Inactive';
    default:
      return 'Unknown';
  }
};

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    image: '',
    images: [] as string[],
    discount: '',
    discountType: 'percentage',
    originalPrice: '',
    discountExpiry: '',
    status: 'active',
    additionalImages: [] as string[],
  });

  // Auto-calc discount% and 30-day expiry preview for the form
  const computedDiscountPct = (() => {
    const op = Number(formData.originalPrice);
    const sp = Number(formData.price);
    if (!isNaN(op) && !isNaN(sp) && op > 0 && sp > 0 && op > sp) {
      return Math.round(((op - sp) / op) * 100);
    }
    return null;
  })();
  const computedExpiry = computedDiscountPct !== null
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null;
  
  // Filter products based on search and category

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (mounted) setInitialLoading(true);
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const rows = (data.products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category || '',
          price: Number(p.price || 0),
          stock: typeof p.stock === 'number' ? p.stock : Number(p.stock || 0),
          status: p.status || ((Number(p.stock || 0) <= 0) ? 'out_of_stock' : (Number(p.stock || 0) <= 10 ? 'low_stock' : 'active')),
          image: p.image || '/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg',
          description: p.description || '',
          tagline: p.tagline || '',
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          discount: p.discount ? Number(p.discount) : undefined,
          discountType: p.discount_type || undefined,
          discountExpiry: p.discount_expiry || undefined,
          additionalImages: p.additional_images && p.additional_images !== 'null' && p.additional_images !== '' ? 
            p.additional_images.split(',').filter((url: string) => url.trim()) : [],
          createdAt: new Date().toISOString().split('T')[0],
        }));
        if (mounted) setProducts(rows);
      } catch {}
      finally {
        if (mounted) setInitialLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = async () => {
    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category) newErrors.category = 'Select a category';
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) newErrors.price = 'Enter a valid price (> 0)';
    if (formData.stock && (isNaN(Number(formData.stock)) || Number(formData.stock) < 0)) newErrors.stock = 'Stock must be 0 or more';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({ title: 'Please fix the highlighted fields', variant: 'destructive' });
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        category: formData.category || null,
        tagline: formData.tagline || null,
        description: formData.description || null,
        price: Number(formData.price || 0),
        image: formData.image || '/products/WhatsApp Image 2025-09-01 at 11.28.18.jpeg',
        stock: parseInt(formData.stock || '0'),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        // Auto-fill discount% if user provided originalPrice > price and left discount empty
        discount: (formData.discount ? Number(formData.discount) : (computedDiscountPct ?? null)),
        discountType: (formData.discount ? formData.discountType : (computedDiscountPct !== null ? 'percentage' : null)),
        discountExpiry: formData.discountExpiry || null,
        additionalImages: formData.additionalImages || [],
      };

      console.log('Sending payload with additionalImages:', payload.additionalImages);

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const created = data.product || {};
        const newProduct = {
          id: created.id ?? Date.now(),
          name: created.name ?? payload.name,
          category: created.category ?? (payload.category || ''),
          price: Number(created.price ?? payload.price),
          stock: payload.stock,
          status: payload.stock > 10 ? 'active' : payload.stock > 0 ? 'low_stock' : 'out_of_stock',
          image: created.image ?? payload.image,
          description: created.description ?? (payload.description || ''),
          createdAt: new Date().toISOString().split('T')[0],
        } as any;
        setProducts([...products, newProduct]);
        toast({ title: 'Product added' });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.error || 'Failed to create product', variant: 'destructive' });
        return;
      }

      setIsAddDialogOpen(false);
      resetForm();
    } catch (e) {
      toast({ title: 'Network error creating product', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = () => {
    const updatedProducts = products.map(product =>
      product.id === selectedProduct.id
        ? {
            ...product,
            name: formData.name,
            tagline: formData.tagline,
            category: formData.category,
            price: parseInt(formData.price),
            stock: parseInt(formData.stock),
            status: formData.status || (parseInt(formData.stock) > 10 ? 'active' : parseInt(formData.stock) > 0 ? 'low_stock' : 'out_of_stock'),
            description: formData.description,
            image: formData.image,
            originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
            discount: formData.discount ? parseFloat(formData.discount) : undefined,
            discountExpiry: formData.discountExpiry || undefined,
            additionalImages: formData.additionalImages || [],
          }
        : product
    );
    setProducts(updatedProducts);
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteProduct = () => {
    setProducts(products.filter(product => product.id !== selectedProduct.id));
    setIsDeleteDialogOpen(false);
    setSelectedProduct(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      tagline: '',
      category: '',
      price: '',
      stock: '',
      description: '',
      image: '',
      images: [],
      discount: '',
      discountType: 'percentage',
      originalPrice: '',
      discountExpiry: '',
      status: 'active',
      additionalImages: [],
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) return;
      const data = await res.json();
      setFormData(prev => ({ ...prev, image: data.url }));
    } catch {
      toast({ title: 'Image upload failed', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    console.log('Uploading additional images:', files.length, 'files');
    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        console.log('Uploaded image URL:', data.url);
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);
      console.log('All uploaded URLs:', urls);
      setFormData(prev => {
        const newData = { 
          ...prev, 
          additionalImages: [...prev.additionalImages, ...urls].slice(0, 4) 
        };
        console.log('Updated formData.additionalImages:', newData.additionalImages);
        return newData;
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Image upload failed', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const openEditDialog = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      tagline: product.tagline || '',
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description,
      image: product.image,
      images: product.images || [],
      discount: product.discount?.toString() || '',
      discountType: product.discountType || 'percentage',
      originalPrice: product.originalPrice?.toString() || '',
      discountExpiry: product.discountExpiry || '',
      status: product.status || 'active',
      additionalImages: product.additionalImages || [],
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
          className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="w-full h-48 bg-slate-200 animate-pulse rounded-t-lg" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-2/3 bg-slate-200 animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-slate-200 animate-pulse rounded" />
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-24 bg-slate-200 animate-pulse rounded" />
                    <div className="h-5 w-5 bg-slate-200 animate-pulse rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-contain rounded-t-lg"
                />
                <Badge className={`absolute top-2 right-2 ${getStatusColor(product.status)}`}>
                  {getStatusText(product.status)}
                </Badge>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(product)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeleteDialog(product)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">TSh {product.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                  </div>
                  {product.stock <= 10 && product.stock > 0 && (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  {product.stock === 0 && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {!initialLoading && filteredProducts.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Product
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Add a new product to your inventory with images and pricing details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name<span className="text-red-600"> *</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                  {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Enter product tagline"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category<span className="text-red-600"> *</span></Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(cat => cat !== 'All').map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-red-600">{errors.category}</p>}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Product Images</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="featuredImage">Featured Image</Label>
                  <Input
                    id="featuredImage"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append('file', file);
                      try {
                        setIsUploading(true);
                        const res = await fetch('/api/upload', { method: 'POST', body: fd });
                        if (!res.ok) return;
                        const data = await res.json();
                        setFormData({ ...formData, image: data.url });
                      } catch {
                        toast({ title: 'Image upload failed', variant: 'destructive' });
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                  />
                  {formData.image && (
                    <img src={formData.image} alt="preview" className="mt-2 h-24 w-24 object-contain rounded" />
                  )}
                  <p className="text-xs text-gray-500">This will be the main product image</p>
                </div>
                <div className="grid gap-2">
                  <Label>Additional Images</Label>
                  <div className="space-y-2">
                    {formData.images.map((img, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append('file', file);
                            try {
                              setIsUploading(true);
                              const res = await fetch('/api/upload', { method: 'POST', body: fd });
                              if (!res.ok) return;
                              const data = await res.json();
                              const newImages = [...formData.images];
                              newImages[index] = data.url;
                              setFormData({ ...formData, images: newImages });
                            } catch {
                              toast({ title: 'Image upload failed', variant: 'destructive' });
                            } finally {
                              setIsUploading(false);
                            }
                          }}
                        />
                        {img && <img src={img} alt={`img-${index}`} className="h-16 w-16 object-contain rounded" />}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== index);
                            setFormData({ ...formData, images: newImages });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })}
                    >
                      Add Image
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Pricing & Inventory</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="originalPrice">Original Price (TSh)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Selling Price (TSh)<span className="text-red-600"> *</span></Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                  />
                  {errors.price && <p className="text-xs text-red-600">{errors.price}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                  {errors.stock && <p className="text-xs text-red-600">{errors.stock}</p>}
                </div>
              </div>
              
              {/* Discount Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select value={formData.discountType} onValueChange={(value) => setFormData({ ...formData, discountType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (TSh)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="discount">
                    Discount {formData.discountType === 'percentage' ? '(%)' : '(TSh)'}
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  />
                </div>
              </div>

              {/* Discount Preview when Original > Selling */}
              {Number(formData.originalPrice) > Number(formData.price) && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Discount Preview:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-gray-900">TSh {formData.price || 0}</span>
                    <span className="text-sm text-gray-500 line-through">TSh {formData.originalPrice}</span>
                    <span className="text-sm text-green-600 font-medium">
                      {computedDiscountPct !== null ? `${computedDiscountPct}% OFF` : (formData.discountType === 'percentage' ? `${formData.discount}% OFF` : `TSh ${formData.discount} OFF`)}
                    </span>
                  </div>
                  {(formData.discountExpiry || computedExpiry) && (
                    <div className="text-xs text-slate-600 mt-1">
                      Expires on: <span className="font-medium">{formData.discountExpiry || computedExpiry}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Optional End Date */}
              <div className="grid gap-2">
                <Label htmlFor="discountExpiry">Discount End Date (optional)</Label>
                <Input
                  id="discountExpiry"
                  type="date"
                  value={formData.discountExpiry}
                  onChange={(e) => setFormData({ ...formData, discountExpiry: e.target.value })}
                />
                <p className="text-xs text-slate-500">Leave empty to auto-set 30 days from today when Original Price is higher than Selling Price.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddProduct}
              disabled={isSubmitting || isUploading}
              className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</span>
              ) : isUploading ? (
                <span className="inline-flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading image...</span>
              ) : (
                'Add Product'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information with images and pricing details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Product Name<span className="text-red-600"> *</span></Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-tagline">Tagline</Label>
                  <Input
                    id="edit-tagline"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Enter product tagline"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category<span className="text-red-600"> *</span></Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(cat => cat !== 'All').map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Pricing & Inventory</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Price (TSh)<span className="text-red-600"> *</span></Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                  />
                  {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">Stock<span className="text-red-600"> *</span></Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                  {errors.stock && <p className="text-sm text-red-600">{errors.stock}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Discount Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Discount Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-original-price">Original Price (TSh)</Label>
                  <Input
                    id="edit-original-price"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-discount">Discount (%)</Label>
                  <Input
                    id="edit-discount"
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-discount-expiry">Discount Expiry</Label>
                  <Input
                    id="edit-discount-expiry"
                    type="date"
                    value={formData.discountExpiry}
                    onChange={(e) => setFormData({ ...formData, discountExpiry: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Product Images</h4>
              <div className="grid gap-4">
                {/* Main Image */}
                <div className="grid gap-2">
                  <Label>Main Product Image</Label>
                  <div className="flex items-center gap-4">
                    {formData.image ? (
                      <div className="relative">
                        <img
                          src={formData.image}
                          alt="Product preview"
                          className="w-20 h-20 object-contain rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#b47435] file:text-white hover:file:bg-[#a0662f]"
                      />
                      <p className="text-sm text-gray-500 mt-1">Upload a high-quality product image</p>
                    </div>
                  </div>
                </div>

                {/* Additional Images */}
                <div className="grid gap-2">
                  <Label>Additional Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.additionalImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Additional ${index + 1}`}
                          className="w-full h-20 object-contain rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.additionalImages.filter((_, i) => i !== index);
                            setFormData({ ...formData, additionalImages: newImages });
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {formData.additionalImages.length < 4 && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center h-20">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('additional-images')?.click()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Image
                        </Button>
                        <Input
                          id="additional-images"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAdditionalImageUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditProduct}
              disabled={isSubmitting || isUploading}
              className="bg-gradient-to-r from-[#b47435] to-[#b77123] hover:from-[#a0662f] hover:to-[#9d5e1f]"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</span>
              ) : isUploading ? (
                <span className="inline-flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading image...</span>
              ) : (
                'Update Product'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
