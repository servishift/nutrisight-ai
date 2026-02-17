import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface Props {
  children: ReactNode;
}

export default function PageLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
