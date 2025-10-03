'use client';

import { useState, useEffect } from 'react';
import { ChatHistorySummaryObject, ApiResponse } from '@/lib/types';
import { ChatHistorySideBar } from '@/components/chat/ChatHistorySideBar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [chatHistories, setChatHistories] = useState<
    ChatHistorySummaryObject[]
  >([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 現在のチャットIDを取得
  const currentChatId = pathname.split('/')[2] || null;

  // チャット履歴一覧の取得（一度だけ実行）
  useEffect(() => {
    const fetchChatHistories = async () => {
      try {
        const response = await fetch('/api/db/chat');
        const result: ApiResponse<ChatHistorySummaryObject[]> =
          await response.json();

        if (result.success && result.data) {
          setChatHistories(result.data);
        } else {
          console.error('Failed to fetch chat histories:', result.error);
        }
      } catch (error) {
        console.error('Error fetching chat histories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistories();
  }, []);

  // サイドバートグル
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-screen flex">
        {/* モバイル用サイドバーオーバーレイ */}
        <div
          className={`
          lg:hidden fixed inset-0 z-50 transition-opacity
          ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        >
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={toggleSidebar}
          />
          <div
            className={`
            absolute left-0 top-0 h-full w-80 bg-background border-r shadow-lg transform transition-transform
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          >
            <div className="flex justify-end p-4">
              <Button variant="ghost" size="sm" onClick={toggleSidebar}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ChatHistorySideBar
              histories={chatHistories}
              currentChatId={currentChatId}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* デスクトップ用サイドバー */}
        <div className="hidden lg:block">
          <ChatHistorySideBar
            histories={chatHistories}
            currentChatId={currentChatId}
            isLoading={isLoading}
          />
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-[800px] flex flex-col min-h-screen">
            {/* ヘッダー */}
            <header className="border-b bg-background/80 backdrop-blur-sm p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={toggleSidebar}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="font-semibold">AI Assistant</h1>
                  <p className="text-sm text-muted-foreground">
                    {currentChatId ? 'アクティブなチャット' : '新しいチャット'}
                  </p>
                </div>
              </div>
            </header>

            {/* 子コンポーネント（ページコンテンツ） */}
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
