import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Sun, Moon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import useAuthSession from "@/hooks/use-auth-session";
import { logout } from "@/lib/api";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { isAuthenticated, user } = useAuthSession();
    const userName = typeof user?.name === "string" ? user.name : "Warga";
    const userInitial = userName.trim().charAt(0).toUpperCase() || "W";
    const isAdmin = user?.role === "ADMIN";

    const handleLogout = () => {
        logout();
        setIsOpen(false);
    };


    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/icon.png" alt="SentraWarga Icon" className="w-6 h-7" />
                        <span className="font-bold text-lg text-foreground">SentraWarga</span>
                    </Link>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                <Button size="sm" className="gradient-primary text-primary-foreground border-0" asChild>
                                    <Link to="/lapor">Upload Laporan</Link>
                                </Button>
                                {isAdmin ? (
                                    <Button variant="secondary" size="sm" asChild>
                                        <Link to="/admin">Dashboard</Link>
                                    </Button>
                                ) : (
                                    <Button variant="secondary" size="sm" asChild>
                                        <Link to="/laporan-saya">Laporan Saya</Link>
                                    </Button>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            title={userName}
                                            aria-label={`Menu akun ${userName}`}
                                        >
                                            {userInitial}
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem onSelect={handleLogout}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Keluar dari akun
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" className="text-foreground" asChild>
                                    <Link to="/daftar">Daftar</Link>
                                </Button>
                                <Button size="sm" className="gradient-primary text-primary-foreground border-0" asChild>
                                    <Link to="/masuk">Masuk</Link>
                                </Button>
                            </>
                        )}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Mobile Toggle */}
                    <div className="md:hidden flex items-center gap-1">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                        <button
                            className="p-2 text-foreground"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden py-4 border-t border-border">
                        <div className="flex flex-col gap-2 mt-4">
                            {isAuthenticated ? (
                                <>
                                    <Button size="sm" className="w-full gradient-primary text-primary-foreground border-0" asChild>
                                        <Link to="/lapor" onClick={() => setIsOpen(false)}>Upload Laporan</Link>
                                    </Button>
                                    {isAdmin ? (
                                        <Button size="sm" className="w-full" asChild>
                                            <Link to="/admin" onClick={() => setIsOpen(false)}>Dashboard</Link>
                                        </Button>
                                    ) : (
                                        <Button size="sm" className="w-full" asChild>
                                            <Link to="/laporan-saya" onClick={() => setIsOpen(false)}>Laporan Saya</Link>
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                                        Keluar dari akun
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" size="sm" className="w-full" asChild>
                                        <Link to="/daftar" onClick={() => setIsOpen(false)}>Daftar</Link>
                                    </Button>
                                    <Button size="sm" className="w-full gradient-primary text-primary-foreground border-0" asChild>
                                        <Link to="/masuk" onClick={() => setIsOpen(false)}>Masuk</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
