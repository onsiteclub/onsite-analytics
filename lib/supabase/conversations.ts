// ============================================
// ARGUS - CONVERSATION MANAGEMENT (Client-side)
// CRUD operations for argus_conversations table
// ============================================

import { createClient } from './client';
import type { ArgusConversation, ArgusMessage } from './schema';

// ============================================
// CLIENT-SIDE FUNCTIONS (Browser)
// ============================================

/**
 * Get all conversations for current user
 */
export async function getConversations(): Promise<ArgusConversation[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('argus_conversations')
    .select('*')
    .eq('archived', false)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get starred conversations
 */
export async function getStarredConversations(): Promise<ArgusConversation[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('argus_conversations')
    .select('*')
    .eq('starred', true)
    .eq('archived', false)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching starred conversations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(id: string): Promise<ArgusConversation | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('argus_conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }

  return data;
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  initialMessage?: string
): Promise<ArgusConversation | null> {
  const supabase = createClient();

  const messages: ArgusMessage[] = initialMessage
    ? [{ role: 'user', content: initialMessage, timestamp: new Date().toISOString() }]
    : [];

  const { data, error } = await supabase
    .from('argus_conversations')
    .insert({
      user_id: userId,
      title: initialMessage ? generateTitle(initialMessage) : 'New Conversation',
      messages,
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

/**
 * Add a message to conversation
 */
export async function addMessage(
  conversationId: string,
  message: ArgusMessage
): Promise<boolean> {
  const supabase = createClient();

  // First get current messages
  const { data: conversation, error: fetchError } = await supabase
    .from('argus_conversations')
    .select('messages')
    .eq('id', conversationId)
    .single();

  if (fetchError || !conversation) {
    console.error('Error fetching conversation:', fetchError);
    return false;
  }

  // Append new message
  const updatedMessages = [...(conversation.messages || []), message];

  // Update conversation
  const { error: updateError } = await supabase
    .from('argus_conversations')
    .update({
      messages: updatedMessages,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  if (updateError) {
    console.error('Error adding message:', updateError);
    return false;
  }

  return true;
}

/**
 * Update conversation title
 */
export async function updateTitle(
  conversationId: string,
  title: string
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('argus_conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating title:', error);
    return false;
  }

  return true;
}

/**
 * Toggle starred status
 */
export async function toggleStar(
  conversationId: string,
  starred: boolean
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('argus_conversations')
    .update({ starred, updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) {
    console.error('Error toggling star:', error);
    return false;
  }

  return true;
}

/**
 * Archive conversation (soft delete)
 */
export async function archiveConversation(
  conversationId: string
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('argus_conversations')
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) {
    console.error('Error archiving conversation:', error);
    return false;
  }

  return true;
}

/**
 * Delete conversation permanently
 */
export async function deleteConversation(
  conversationId: string
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('argus_conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }

  return true;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a title from the first message
 */
export function generateTitle(message: string): string {
  // Remove special characters and truncate
  const clean = message
    .replace(/[#@\/\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate to ~50 chars at word boundary
  if (clean.length <= 50) return clean;

  const truncated = clean.substring(0, 50);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 30
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * Search conversations by content
 */
export async function searchConversations(
  query: string
): Promise<ArgusConversation[]> {
  const supabase = createClient();

  // Note: For better search, consider using Supabase Full Text Search
  const { data, error } = await supabase
    .from('argus_conversations')
    .select('*')
    .eq('archived', false)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error searching conversations:', error);
    return [];
  }

  if (!data) return [];

  // Client-side filtering (for now)
  const lowerQuery = query.toLowerCase();
  return data.filter(conv => {
    // Search in title
    if (conv.title?.toLowerCase().includes(lowerQuery)) return true;

    // Search in messages
    return conv.messages?.some((msg: ArgusMessage) =>
      msg.content.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(): Promise<{
  total: number;
  starred: number;
  thisWeek: number;
}> {
  const supabase = createClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [total, starred, thisWeek] = await Promise.all([
    supabase
      .from('argus_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('archived', false),
    supabase
      .from('argus_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('starred', true)
      .eq('archived', false),
    supabase
      .from('argus_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('archived', false)
      .gte('created_at', weekAgo),
  ]);

  return {
    total: total.count || 0,
    starred: starred.count || 0,
    thisWeek: thisWeek.count || 0,
  };
}
