import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Orbis.Nft — Beyond Earth & Familiar Boundaries',
  description: 'A digital object fixed beyond time and place. An exploration of distance, form, and silence in space.',
};

export default function OrbisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark bg-[#010828]">
      {children}
    </div>
  );
}
