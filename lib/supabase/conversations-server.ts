// ============================================
// ARGUS - CONVERSATION MANAGEMENT (Server-side)
// Server-only operations for argus_conversations
// Only import this file from API routes or server components
// ============================================

import { createAdminClient } from './server';
import { generateTitle } from './conversations';
import type { ArgusConversation, ArgusMessage } from './schema';

/**
 * Add message with AI response (server-side)
 */
export async function addMessageWithResponse(
  conversationId: string,
  userMessage: ArgusMessage,
  aiResponse: ArgusMessage
): Promise<boolean> {
  const supabase = createAdminClient();

  // Get current messages
  const { data: conversation, error: fetchError } = await supabase
    .from('argus_conversations')
    .select('messages, title')
    .eq('id', conversationId)
    .single();

  if (fetchError || !conversation) {
    console.error('Error fetching conversation:', fetchError);
    return false;
  }

  // Append both messages
  const updatedMessages = [
    ...(conversation.messages || []),
    userMessage,
    aiResponse,
  ];

  // Auto-generate title if it's the first exchange
  let newTitle = conversation.title;
  if (conversation.messages?.length === 0 || conversation.title === 'New Conversation') {
    newTitle = generateTitle(userMessage.content);
  }

  // Update conversation
  const { error: updateError } = await supabase
    .from('argus_conversations')
    .update({
      messages: updatedMessages,
      title: newTitle,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  if (updateError) {
    console.error('Error updating conversation:', updateError);
    return false;
  }

  return true;
}

/**
 * Create conversation with first exchange (server-side)
 */
export async function createConversationWithResponse(
  userId: string,
  userMessage: ArgusMessage,
  aiResponse: ArgusMessage
): Promise<ArgusConversation | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('argus_conversations')
    .insert({
      user_id: userId,
      title: generateTitle(userMessage.content),
      messages: [userMessage, aiResponse],
      starred: false,
      archived: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return data;
}
