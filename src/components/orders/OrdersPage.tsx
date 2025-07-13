
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

type Order = Tables<'orders'> & {
  products: Tables<'products'> | null;
  buyer_user: Tables<'users'> | null;
  seller_user: Tables<'users'> | null;
};

const OrdersPage = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['orders', userProfile?.id],
    queryFn: async () => {
      if (!userProfile) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (*),
          buyer_user:users!orders_buyer_id_fkey (name, email),
          seller_user:users!orders_seller_id_fkey (name, email, brand_name)
        `)
        .or(`buyer_id.eq.${userProfile.id},seller_id.eq.${userProfile.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      return data as any[];
    },
    enabled: !!userProfile
  });

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'confirmed' | 'completed') => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Order Updated",
      description: `Order status changed to ${newStatus}.`,
    });
    
    refetch();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <Package className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-red-500';
    }
  };

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Please sign in to view your orders.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Package className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No orders found</h2>
          <p className="text-muted-foreground">
            You haven't placed any orders yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Order #{order.id.slice(0, 8)}
                </CardTitle>
                <Badge className={getStatusColor(order.status || 'pending')}>
                  {getStatusIcon(order.status || 'pending')}
                  <span className="ml-1 capitalize">{order.status}</span>
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Product Details</h4>
                  <p className="text-sm text-muted-foreground">
                    Product: {order.products?.name || 'Product not found'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {order.quantity}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Price: ${Number(order.total_price).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Payment: {order.payment_method.replace('_', ' ')}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">
                    {userProfile.role === 'buyer' ? 'Seller Info' : 'Buyer Info'}
                  </h4>
                  {userProfile.role === 'buyer' ? (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Seller: {order.seller_user?.brand_name || order.seller_user?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Email: {order.seller_user?.email}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Buyer: {order.buyer_user?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Email: {order.buyer_user?.email}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    Order Date: {new Date(order.created_at || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {userProfile.role === 'seller' && order.seller_id === userProfile.id && (
                <div className="mt-4 flex space-x-2">
                  {order.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                    >
                      Confirm Order
                    </Button>
                  )}
                  {order.status === 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                    >
                      Mark as Completed
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
