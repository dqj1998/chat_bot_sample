'use client';

import { MessageObject } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: MessageObject;
  className?: string;
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'flex w-full gap-3 p-4',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {/* アシスタントの場合は左側にアバター */}
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* メッセージ本体 */}
      <div
        className={cn(
          'flex flex-col gap-2 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* 役割バッジとタイムスタンプ */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={isUser ? 'default' : 'secondary'}>
            {isUser ? 'あなた' : 'アシスタント'}
          </Badge>
          <span>{formatTime(message.timestamp)}</span>
        </div>

        {/* メッセージ内容 */}
        <div
          className={cn(
            'relative rounded-lg px-4 py-3 shadow-sm',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border'
          )}
        >
          {isUser ? (
            // ユーザーメッセージは通常のテキスト表示
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            // アシスタントメッセージはマークダウン表示
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // コードブロックのスタイリング
                  code: ({ node, className, ...props }) => {
                    const isInline = !className?.includes('language-');
                    return (
                      <code
                        className={cn(
                          isInline
                            ? 'bg-muted px-1 py-0.5 rounded text-sm'
                            : 'block bg-muted p-2 rounded-md text-sm overflow-x-auto',
                          className
                        )}
                        {...props}
                      />
                    );
                  },
                  // リンクのスタイリング
                  a: ({ node, ...props }) => (
                    <a
                      className="text-primary underline hover:no-underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  ),
                }}
              />
            </div>
          )}

          {/* コピーボタン */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* ユーザーの場合は右側にアバター */}
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
