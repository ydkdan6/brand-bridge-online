
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

type Product = Tables<'products'> & {
  users: Tables<'users'> | null;
};

interface ProductGridProps {
  onProductClick: (product: Product) => void;
}

const ProductGrid = ({ onProductClick }: ProductGridProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          users!products_seller_id_fkey (
            id,
            name,
            brand_name,
            profile_picture,
            whatsapp_number,
            calling_number1,
            calling_number2,
            is_verified
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      return data as Product[];
    }
  });

  const addToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!userProfile || userProfile.role !== 'buyer') {
      toast({
        title: "Access Denied",
        description: "Please sign in as a buyer to add items to cart.",
        variant: "destructive"
      });
      return;
    }

    // Get existing cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = existingCart.find((item: any) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      existingCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        seller_id: product.seller_id,
        quantity: 1,
        max_quantity: product.quantity
      });
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
            <CardHeader>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading products. Please try again later.</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No products available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card 
          key={product.id} 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onProductClick(product)}
        >
          <div className="relative">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-48 object-cover rounded-t-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            {product.negotiable && (
              <Badge className="absolute top-2 right-2 bg-green-500">
                Negotiable
              </Badge>
            )}
          </div>

          <CardHeader>
            <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                ₦{Number(product.price).toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">
                {product.quantity} available
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {product.description}
            </p>
            
            {product.users && (
              <div className="flex items-center space-x-2">
                {product.users.profile_picture && (
                  <img
                    src={product.users.profile_picture}
                    alt={product.users.name}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-sm font-medium">
                  {product.users.brand_name || product.users.name}
                </span>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex space-x-2">
            <Button
              onClick={(e) => addToCart(product, e)}
              className="flex-1"
              size="sm"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
            
            {product.negotiable && product.users?.whatsapp_number && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const message = encodeURIComponent(
                    `Hi, I'm interested in your product: ${product.name}.Price: ₦${product.price}. Can we negotiate?`
                  );
                  window.open(`https://wa.me/${product.users.whatsapp_number}?text=${message}`, '_blank');
                }}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ProductGrid;
