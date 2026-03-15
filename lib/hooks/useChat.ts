'use client';

import { useState, useCallback } from 'react';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface UseChatOptions {
    onError?: (error: Error) => void;
    initialMessages?: Message[];
}

export function useChat(options?: UseChatOptions) {
    const [messages, setMessages] = useState<Message[]>(options?.initialMessages || []);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const sendMessage = useCallback(
        async (userMessage: string) => {
            if (!userMessage.trim()) return;

            // Add user message to chat
            const userMsg: Message = {
                id: Date.now().toString(),
                role: 'user',
                content: userMessage,
            };

            setMessages((prev) => [...prev, userMsg]);
            setIsLoading(true);
            setError(null);

            // Create assistant message placeholder
            const assistantId = (Date.now() + 1).toString();
            const assistantMsg: Message = {
                id: assistantId,
                role: 'assistant',
                content: '',
            };

            setMessages((prev) => [...prev, assistantMsg]);

            try {
                const response = await fetch('/api/completion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: userMessage }),
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.statusText}`);
                }

                if (!response.body) {
                    throw new Error('No response body');
                }

                // Stream the response
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });

                    // Update the assistant message with streamed content
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantId
                                ? { ...msg, content: msg.content + chunk }
                                : msg
                        )
                    );
                }
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error);
                options?.onError?.(error);

                // Remove the incomplete assistant message on error
                setMessages((prev) =>
                    prev.filter((msg) => msg.id !== assistantId)
                );
            } finally {
                setIsLoading(false);
            }
        },
        [options]
    );

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        setMessages,
    };
}
