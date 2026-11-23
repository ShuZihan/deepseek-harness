import type { InboxState } from '@deepseek-ai/dsh-agent/types'
import type { SessionFace } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'

/** A pending message accepted by the embedding Host before Harness receives it. */
export type HostQueuedMessage = InboxState['next-turn'][number] & { readonly editable?: boolean }

/** Browser carrier options for the embedded conversation surface. */
export interface EmbeddedConversationHost {
  readonly showTrajectory?: boolean
  readonly inlineImageTypes?: readonly string[]
  readonly queuedMessages?: (session: SessionFace) => ObservableSnapshot<readonly HostQueuedMessage[]> | undefined
}

/** Read the optional carrier initialized before browser boot. */
export function embeddedConversationHost(): EmbeddedConversationHost | undefined {
  return (globalThis as { __DSH_CONVERSATION_HOST__?: EmbeddedConversationHost }).__DSH_CONVERSATION_HOST__
}

/** @param native - messages already in the Agent Inbox; @param pending - messages still held by the carrier. */
export function mergeQueuedMessages(
  native: InboxState['next-turn'],
  pending: readonly HostQueuedMessage[],
): readonly HostQueuedMessage[] {
  if (pending.length === 0) return native
  const admitted = new Set(native.flatMap(({ source }) =>
    source.kind === 'user' && 'rpcId' in source ? [source.rpcId] : []))
  return [...native, ...pending.filter(({ source }) => !('rpcId' in source) || !admitted.has(source.rpcId))]
}
