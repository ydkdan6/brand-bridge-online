
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Users, Package, ShoppingCart, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

type User = Tables<'users'>;
type Product = Tables<'products'> & {
  users: Tables<'users'> | null;
};
type Order = Tables<'orders'> & {
  products: Tables<'products'> | null;
  buyer_user: Tables<'users'> | null;
  seller_user: Tables<'users'> | null;
};

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  // Check if user is admin
  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Shield className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as User[];
    }
  });

  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          users!products_seller_id_fkey (name, brand_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    }
  });

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (*),
          buyer_user:users!orders_buyer_id_fkey (name, email),
          seller_user:users!orders_seller_id_fkey (name, email, brand_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    }
  });

  const toggleUserVerification = async (userId: string, isVerified: boolean) => {
    const { error } = await supabase
      .from('users')
      .update({ is_verified: !isVerified })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user verification:', error);
      toast({
        title: "Error",
        description: "Failed to update user verification status.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "User Updated",
      description: `User verification ${!isVerified ? 'enabled' : 'disabled'}.`,
    });
    
    refetchUsers();
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('users')
      .update({ is_active: !isActive })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "User Updated",
      description: `User ${!isActive ? 'activated' : 'deactivated'}.`,
    });
    
    refetchUsers();
  };

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Product Deleted",
      description: "Product has been removed successfully.",
    });
    
    refetchProducts();
  };

  const stats = {
    totalUsers: users?.length || 0,
    verifiedSellers: users?.filter(u => u.role === 'seller' && u.is_verified).length || 0,
    totalProducts: products?.length || 0,
    totalOrders: orders?.length || 0,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Sellers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedSellers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users?.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{user.name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex space-x-2 mt-1">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        {user.brand_name && (
                          <Badge variant="outline">{user.brand_name}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {user.role === 'seller' && (
                        <div className="flex items-center space-x-2">
                          <label className="text-sm">Verified</label>
                          <Switch
                            checked={user.is_verified || false}
                            onCheckedChange={() => toggleUserVerification(user.id, user.is_verified || false)}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <label className="text-sm">Active</label>
                        <Switch
                          checked={user.is_active || false}
                          onCheckedChange={() => toggleUserActive(user.id, user.is_active || false)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products?.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <div>
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Seller: {product.users?.brand_name || product.users?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Price: ${Number(product.price).toFixed(2)} | Qty: {product.quantity}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteProduct(product.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders?.map((order) => (
                  <div key={order.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Order #{order.id.slice(0, 8)}</h4>
                      <Badge>{order.status}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Product</p>
                        <p className="text-muted-foreground">{order.products?.name}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Buyer</p>
                        <p className="text-muted-foreground">{order.buyer_user?.name}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Total</p>
                        <p className="text-muted-foreground">${Number(order.total_price).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
