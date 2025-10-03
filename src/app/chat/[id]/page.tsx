'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChatHistoryObject, ApiResponse } from '@/lib/types';
import { ChatForm } from '@/components/chat/ChatForm';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';

export default function ChatDetailPage() {
  const params = useParams();
  const chatId = params.id as string;

  // 状態管理
  const [currentChat, setCurrentChat] = useState<ChatHistoryObject | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 現在のチャット詳細の取得
  const fetchCurrentChat = async (id: string) => {
    try {
      const response = await fetch(`/api/db/chat/${id}`);
      const result: ApiResponse<ChatHistoryObject> = await response.json();

      if (result.success && result.data) {
        setCurrentChat(result.data);
      } else {
        // チャットが存在しない場合、新規チャットとして初期化
        setCurrentChat({
          chatId: id,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching current chat:', error);
      // エラーの場合も新規チャットとして初期化
      setCurrentChat({
        chatId: id,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // 初期データロード
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchCurrentChat(chatId);
      setIsLoading(false);
    };

    if (chatId) {
      loadData();
    }
  }, [chatId]);

  // メッセージ送信後の処理
  const handleMessageSent = async (
    userMessage: string,
    assistantResponse: string
  ) => {
    if (!currentChat) return;

    // 現在のチャットにユーザーメッセージとアシスタントメッセージを追加
    const now = new Date().toISOString();
    const updatedChat: ChatHistoryObject = {
      ...currentChat,
      messages: [
        ...currentChat.messages,
        {
          role: 'user',
          content: userMessage,
          timestamp: now,
        },
        {
          role: 'assistant',
          content: assistantResponse,
          timestamp: now,
        },
      ],
      updatedAt: now,
    };

    setCurrentChat(updatedChat);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1">
        {/* メインコンテンツスケルトン */}
        <div className="flex-1 p-4 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* チャットメッセージ表示エリア */}
      <div className="flex-1 overflow-y-auto">
        {currentChat?.messages.length === 0 ? (
          // 初期状態の表示
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md mx-auto p-8">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">AI Assistantへようこそ</h2>
              <p className="text-muted-foreground">
                何でもお気軽にご質問ください。あなたの役割とスキルを教えていただければ、
                より具体的で実用的な回答を提供できます。
              </p>
            </div>
          </div>
        ) : (
          // メッセージ一覧の表示
          <div className="space-y-1">
            {currentChat?.messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
          </div>
        )}

        {/* 送信中の表示 */}
        {isSubmitting && (
          <div className="p-4 flex items-center gap-3">
            <div className="animate-pulse flex gap-3 w-full">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* チャット入力フォーム */}
      <div className="border-t bg-background/50 p-4">
        <ChatForm
          chatId={chatId}
          onMessageSent={handleMessageSent}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      </div>
    </>
  );
}
