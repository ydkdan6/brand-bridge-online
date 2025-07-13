
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import Layout from "@/components/Layout";
import AuthForm from "@/components/auth/AuthForm";
import ProductGrid from "@/components/products/ProductGrid";
import { useState } from "react";

const queryClient = new QueryClient();

const HomePage = () => {
  const { user, userProfile, loading } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // Show welcome message for new users
  if (userProfile?.role === 'seller' && !userProfile?.is_verified) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Welcome to Priscilla Market!</h2>
        <p className="text-muted-foreground mb-4">
          Your seller account has been created successfully.
        </p>
        <p className="text-muted-foreground">
          Please wait for admin approval before you can start listing products.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome to Priscilla Market</h1>
        <p className="text-muted-foreground text-lg">
          Discover amazing products from verified sellers
        </p>
      </div>

      <ProductGrid onProductClick={setSelectedProduct} />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
