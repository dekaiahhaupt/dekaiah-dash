'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, History, User, MapPin, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const { user, logout, role } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    return (
        <div className="absolute top-4 left-4 right-4 z-[2000] flex justify-end items-start pointer-events-none gap-2">
            {/* Right: Theme, Menu & Logout */}
            <div className="flex gap-2 pointer-events-auto">
                <ModeToggle />

                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm shadow-md">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[250px] sm:w-[300px] bg-background/80 backdrop-blur-xl border-l-white/20">
                        <div className="flex flex-col gap-6 mt-8">
                            <div className="flex items-center gap-2 px-2">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                    {user.displayName?.[0] || user.email?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">{user.displayName || 'User'}</span>
                                    <span className="text-xs text-muted-foreground capitalize">{role}</span>
                                </div>
                            </div>

                            <nav className="flex flex-col gap-2">
                                <Link href="/" onClick={() => setIsOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Home
                                    </Button>
                                </Link>
                                <Link href="/history" onClick={() => setIsOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start gap-2">
                                        <History className="h-4 w-4" />
                                        Ride History
                                    </Button>
                                </Link>
                                <Link href="/profile" onClick={() => setIsOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start gap-2">
                                        <User className="h-4 w-4" />
                                        Profile
                                    </Button>
                                </Link>
                            </nav>

                            <div className="mt-auto">
                                <Button variant="destructive" className="w-full gap-2" onClick={logout}>
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
