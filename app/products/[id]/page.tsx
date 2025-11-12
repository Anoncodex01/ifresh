import React from 'react';
import ProductDetailClient from './ProductDetailClient';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return <ProductDetailClient productId={params.id} />;
}

