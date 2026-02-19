"use client";
import React, { useState } from 'react';
import { 
  Home, 
  Building2, 
  Mail, 
  FileCheck, 
  BarChart3, 
  LogOut, 
  UserCircle 
} from 'lucide-react';

export default function DashboardPage() {
  // State to track which sidebar button is active
  const [activeTab, setActiveTab] = useState('home');

  // Sidebar buttons configuration
  const menuItems = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'overview', label: 'Company Overview', icon: <Building2 size={20} /> },
    { id: 'generate', label: 'Generate Email', icon: <Mail size={20} /> },
    { id: 'status', label: 'Application Status', icon: <FileCheck size={20} /> },
    { id: 'stats', label: 'Statistics', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-[#E5E5E5] font-sans">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-[#C0534F] text-white flex flex-col justify-between">
        <div className="mt-16"> 
          <nav className="flex flex-col space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full gap-4 px-6 py-4 transition-colors ${
                  activeTab === item.id 
                    ? 'border-y border-white/40 bg-white/10 font-semibold' 
                    : 'border-y border-transparent hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* LOGOUT BUTTON (Bottom Left) */}
        <div className="p-4">
          <button className="flex items-center gap-3 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded transition-colors">
            <LogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-20 bg-[#C4B2B0] flex items-center justify-between px-8">
          <div className="bg-[#E5E5E5] px-6 py-2 text-sm font-bold text-gray-800 tracking-wide">
            LOGO AND NAME
          </div>
          <button className="h-10 w-10 bg-[#E5E5E5] rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <UserCircle size={28} />
          </button>
        </header>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-10">
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'overview' && <Placeholder title="Company Overview Page" />}
          {activeTab === 'generate' && <Placeholder title="Generate Email Page" />}
          {activeTab === 'status' && <Placeholder title="Application Status Page" />}
          {activeTab === 'stats' && <Placeholder title="Statistics Page" />}
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function HomeView() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <h2 className="text-xl font-medium text-gray-800">Helllo USer</h2>
      
      {/* Updates Box */}
      <div className="w-full h-40 bg-[#E6918D] flex items-center justify-center shadow-sm">
        <span className="text-white text-lg font-medium">Updates</span>
      </div>

      {/* Stats and Graph Split Box */}
      <div className="w-full h-64 bg-[#4A1D1A] flex shadow-sm">
        
        {/* Stats Section (Left Side) */}
        <div className="flex-1 border-r border-white/20 p-8 flex flex-col justify-center">
          <h3 className="text-white/70 text-sm mb-4">Quick Stats</h3>
          <p className="text-white text-4xl font-bold">12</p>
          <p className="text-white/70 text-xs mt-2">Emails Sent</p>
        </div>

        {/* Graph Section (Right Side) */}
        <div className="flex-[2] p-8 flex items-center justify-center">
          <div className="text-center text-white/50">
            <BarChart3 size={40} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Graph placeholder (Copy from Stats later)</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-400">{title}</h2>
    </div>
  );
}