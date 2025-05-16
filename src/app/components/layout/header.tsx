"use client";
import { Video } from 'lucide-react';
import Link from 'next/link';

export default function AppHeader() {
  return (
    <header className="bg-accent text-accent-foreground shadow-md">
      <div className="container mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Video className="h-8 w-8" />
          <h1 className="text-2xl font-semibold">VidTune</h1>
        </Link>
        {/* Future navigation items can go here */}
      </div>
    </header>
  );
}
