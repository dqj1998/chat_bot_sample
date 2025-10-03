'use client';

import {
  InputPromptObject,
  ChatRequestObject,
  ChatResponseObject,
  ApiResponse,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ChatFormUserProfile } from './ChatFormUserProfile';

interface ChatFormProps {
  chatId: string;
  onMessageSent: (userMessage: string, assistantMessage: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

export function ChatForm({
  chatId,
  onMessageSent,
  isSubmitting,
  setIsSubmitting,
}: ChatFormProps) {
  const [formData, setFormData] = useState<InputPromptObject>({
    mainPrompt: '',
    userRole: '',
    userSkills: '',
  });
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.mainPrompt.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody: ChatRequestObject = {
        chatId,
        message: formData,
      };

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result: ApiResponse<ChatResponseObject> = await response.json();

      if (result.success && result.data) {
        // 送信成功時の処理
        onMessageSent(formData.mainPrompt, result.data.content);

        // メインプロンプトのみリセット（ユーザー情報は保持）
        setFormData({
          ...formData,
          mainPrompt: '',
        });
      } else {
        console.error('Failed to send message:', result.error);
        // エラー処理（実際のアプリではユーザーに通知）
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // エラー処理（実際のアプリではユーザーに通知）
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const isFormValid = formData.mainPrompt.trim().length > 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">メッセージを送信</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="prompt" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="prompt">メッセージ</TabsTrigger>
              <TabsTrigger value="profile">プロフィール</TabsTrigger>
            </TabsList>

            <TabsContent value="prompt" className="space-y-4">
              {/* メインプロンプト入力 */}
              <div className="space-y-2">
                <label htmlFor="mainPrompt" className="text-sm font-medium">
                  メインプロンプト
                </label>
                <Textarea
                  id="mainPrompt"
                  placeholder="質問や相談内容を入力してください..."
                  value={formData.mainPrompt}
                  onChange={e =>
                    setFormData({ ...formData, mainPrompt: e.target.value })
                  }
                  onKeyDown={handleKeyDown}
                  className="w-full min-h-[120px] resize-none"
                  rows={5}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Ctrl/Cmd + Enter で送信
                </p>
              </div>

              {/* 送信ボタン */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="min-w-[100px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      送信中...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      送信
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              {/* ユーザープロフィール設定 */}
              <ChatFormUserProfile
                formData={formData}
                onFormDataChange={setFormData}
                isExpanded={true}
                onToggleExpanded={() => {}}
              />
            </TabsContent>
          </Tabs>
        </form>
      </CardContent>
    </Card>
  );
}
