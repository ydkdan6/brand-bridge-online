
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, ShoppingCart, User, LogOut, Settings, Package, Shield, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, userProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account.",
    });
  };

  const getCartItemCount = () => {
    const cart = localStorage.getItem('cart');
    if (!cart) return 0;
    const items = JSON.parse(cart);
    return items.reduce((total: number, item: any) => total + item.quantity, 0);
  };

  const cartItemCount = getCartItemCount();

  return (
    <div className="min-h-screen bg-background text-foreground font-['Poppins',sans-serif]">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-2xl font-bold text-primary hover:opacity-80">
              Priscilla Market
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            {user ? (
              <>
                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-2">
                  {userProfile?.role === 'buyer' && (
                    <div className="relative">
                      <Button
                        variant={location.pathname === '/cart' ? 'default' : 'ghost'}
                        size="sm"
                        asChild
                      >
                        <Link to="/cart">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Cart
                        </Link>
                      </Button>
                      {cartItemCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                          {cartItemCount}
                        </Badge>
                      )}
                    </div>
                  )}

                  <Button
                    variant={location.pathname === '/orders' ? 'default' : 'ghost'}
                    size="sm"
                    asChild
                  >
                    <Link to="/orders">
                      <FileText className="h-4 w-4 mr-2" />
                      Orders
                    </Link>
                  </Button>

                  {userProfile?.role === 'seller' && userProfile?.is_verified && (
                    <Button
                      variant={location.pathname === '/seller' ? 'default' : 'ghost'}
                      size="sm"
                      asChild
                    >
                      <Link to="/seller">
                        <Package className="h-4 w-4 mr-2" />
                        My Products
                      </Link>
                    </Button>
                  )}

                  {userProfile?.role === 'admin' && (
                    <Button
                      variant={location.pathname === '/admin' ? 'default' : 'ghost'}
                      size="sm"
                      asChild
                    >
                      <Link to="/admin">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin
                      </Link>
                    </Button>
                  )}
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span className="hidden sm:inline">{userProfile?.name || 'User'}</span>
                      <Badge variant="secondary" className="hidden sm:inline">
                        {userProfile?.role || 'Loading...'}
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{userProfile?.name}</p>
                      <p className="text-xs text-muted-foreground">{userProfile?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    
                    {/* Mobile Navigation Links */}
                    <div className="md:hidden">
                      {userProfile?.role === 'buyer' && (
                        <DropdownMenuItem asChild>
                          <Link to="/cart" className="flex items-center">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Cart
                            {cartItemCount > 0 && (
                              <Badge variant="destructive" className="ml-auto">
                                {cartItemCount}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Orders
                        </Link>
                      </DropdownMenuItem>

                      {userProfile?.role === 'seller' && userProfile?.is_verified && (
                        <DropdownMenuItem asChild>
                          <Link to="/seller" className="flex items-center">
                            <Package className="h-4 w-4 mr-2" />
                            My Products
                          </Link>
                        </DropdownMenuItem>
                      )}

                      {userProfile?.role === 'admin' && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center">
                            <Shield className="h-4 w-4 mr-2" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                    </div>

                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span className="text-sm">Guest</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Priscilla Market. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
