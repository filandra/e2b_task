import Navigation from '@/components/navigation';
import Footer from '@/components/footer';
import Chat from '@/components/chat';

export default function ChatPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1">
        <Chat />
      </div>
      <Footer />
    </div>
  );
}
