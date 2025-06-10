"use client";

import React from "react";
import Layout from "@/components/layout";
import { User, Mail, Clock, Shield, Lock, BellRing, Moon, Globe, LifeBuoy, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function ProfilePage() {
  return (
    <Layout currentPage="">
      <div className="space-y-6 overflow-auto max-h-[calc(100vh-130px)] pr-2 pb-8">
        <div className="flex items-center">
          <User className="text-purple-400 mr-2" size={22} />
          <h1 className="text-2xl font-bold">My Profile</h1>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Overview */}
          <div className="md:w-1/3">
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-purple-500/30 to-blue-500/30"></div>
              <CardContent className="p-6 relative">
                <Avatar className="h-20 w-20 border-4 border-slate-800 absolute -top-10">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-xl">
                    MS
                  </AvatarFallback>
                </Avatar>
                
                <div className="mt-12 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold">Memory Smith</h2>
                    <p className="text-gray-400">memory.smith@example.com</p>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-400">
                    <Clock size={14} className="mr-1" />
                    <span>Member since May 2025</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                      Pro Plan
                    </div>
                    <div className="px-3 py-1.5 bg-slate-700 text-gray-300 rounded-full text-xs">
                      92 Memories
                    </div>
                    <div className="px-3 py-1.5 bg-slate-700 text-gray-300 rounded-full text-xs">
                      8 Stacks
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Settings */}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-4">Account Settings</h2>
            
            <div className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <h3 className="font-semibold flex items-center mb-4">
                    <User size={16} className="mr-2 text-purple-400" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                      <Input 
                        defaultValue="Memory Smith"
                        className="bg-slate-900/70 border-slate-700 text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
                      <Input 
                        defaultValue="Memory Smith"
                        className="bg-slate-900/70 border-slate-700 text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                      <Input 
                        defaultValue="memory.smith@example.com"
                        className="bg-slate-900/70 border-slate-700 text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                      <Input 
                        defaultValue="San Diego, CA"
                        className="bg-slate-900/70 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <h3 className="font-semibold flex items-center mb-4">
                    <Shield size={16} className="mr-2 text-purple-400" />
                    Security
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                      <Input 
                        type="password"
                        defaultValue="••••••••••••"
                        className="bg-slate-900/70 border-slate-700 text-white"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="2fa" 
                          className="w-4 h-4 bg-slate-800 border-slate-700 rounded text-purple-500 focus:ring-purple-500/20"
                          defaultChecked
                        />
                        <label htmlFor="2fa" className="ml-2 text-sm text-gray-300">Enable two-factor authentication</label>
                      </div>
                      <button className="text-purple-400 text-sm">Set up</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsCard
                  icon={<BellRing size={16} className="mr-2 text-purple-400" />}
                  title="Notifications"
                  description="Manage how and when you receive alerts"
                />
                
                <SettingsCard
                  icon={<Moon size={16} className="mr-2 text-purple-400" />}
                  title="Appearance"
                  description="Configure theme and display preferences"
                />
                
                <SettingsCard
                  icon={<Globe size={16} className="mr-2 text-purple-400" />}
                  title="Language & Region"
                  description="Change language and regional settings"
                />
                
                <SettingsCard
                  icon={<LifeBuoy size={16} className="mr-2 text-purple-400" />}
                  title="Support"
                  description="Get help and contact customer support"
                />
              </div>
              
              <button className="flex items-center mt-4 text-red-400 hover:text-red-300 transition-colors">
                <LogOut size={16} className="mr-2" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Settings Card Component
interface SettingsCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function SettingsCard({ icon, title, description }: SettingsCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 cursor-pointer transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center">
              {icon}
              {title}
            </h3>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </div>
          <div className="text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}