import React from "react";
import { User } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetProfileQuery } from "@/services";

const Header = ({ toggleSidebar, isSidebarOpen }) => {
    const { data: profile } = useGetProfileQuery();
    console.log('User profile:', profile); // Debugging line to check profile data

    return (
        <header
            className={`fixed top-0 bg-white shadow z-40 transition-all duration-300 ${isSidebarOpen ? 'left-64 w-[calc(100%-16rem)]' : 'left-0 w-full'
                }`}
        >
            <div className="h-16 px-4 sm:px-2 lg:px-4 flex items-center justify-between">
                <button
                    onClick={toggleSidebar}
                    className="bg-slate-800 text-white p-2 rounded-md hover:bg-slate-700 focus:outline-none"
                >
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Learning Dashboard</h1>
                <div className="flex items-center space-x-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild className="cursor-pointer ">
                            <Button variant="outline" className="flex items-center bg-slate-900 hover:bg-slate-600">
                                <div className="h-6 w-6 flex justify-center items-center rounded-sm bg-green-500">
                                    <User className="h-8 w-8 text-white" />
                                </div>
                                <span className="ml-2 hidden sm:inline-block text-base text-white">{profile?.data.name || 'User'}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                    My Account <br />
                                    <span className="text-xs text-muted-foreground">{profile?.data.email || 'user@example.com'}</span>
                                </DropdownMenuLabel>
                                <DropdownMenuItem className="cursor-pointer hover:text-white">Profile</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer hover:bg-slate-400">Billing</DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem className="cursor-pointer hover:bg-slate-400">Team</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer hover:bg-slate-400">Subscription</DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>
        </header>
    );
};

export default Header;