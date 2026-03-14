import { Link, useLocation } from "react-router-dom";
import { Leaf, Menu, X, LogOut, LogIn, Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useAlerts } from "@/contexts/AlertsContext";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Diagnose", path: "/diagnose" },
  { label: "Alerts", path: "/alerts" },
  { label: "Crop Health", path: "/crop-health" },
];

const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { unreadCount } = useAlerts();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">CropGuard AI</span>
        </Link>

        {/* Notification Bell with Badge */}
        <Link to="/alerts" className="p-2 hover:bg-accent rounded-lg transition-colors relative md:block hidden">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-background"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <Button variant="ghost" size="sm" className="ml-2 gap-2" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          ) : (
            <Button asChild variant="default" size="sm" className="ml-2 gap-2">
              <Link to="/login">
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-background p-4 md:hidden">
          <Link
            to="/alerts"
            onClick={() => setOpen(false)}
            className={`block rounded-md px-4 py-3 text-sm font-medium ${
              location.pathname === '/alerts'
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            }`}
          >
            Alerts {unreadCount > 0 && `(${unreadCount})`}
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-4 py-3 text-sm font-medium ${
                location.pathname === item.path
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <Button variant="ghost" className="mt-2 w-full gap-2" onClick={() => { signOut(); setOpen(false); }}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          ) : (
            <Button asChild className="mt-2 w-full gap-2" onClick={() => setOpen(false)}>
              <Link to="/login">
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
            </Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
