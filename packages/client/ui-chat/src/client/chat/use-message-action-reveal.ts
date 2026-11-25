import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'

const OWNER = '[data-message-action-owner]'
const OPEN = 'data-message-actions-open'
const TRANSFER_MS = 95

function actionOwner(target: EventTarget | null, chat: HTMLElement): Element | null {
  if (!(target instanceof Element) || !chat.contains(target)) return null
  const owner = target.closest(OWNER)
  if (owner !== null) return owner

  // An assistant reply and the actions that close its turn render in separate seats.
  const reply = target.closest('[data-chat-flow-kind="assistant-step"]:not([data-chat-group-part="reasoning"])')
  const turn = reply?.getAttribute('data-chat-turn')
  return turn == null ? null : chat.querySelector(`${OWNER}[data-turn-tail="${CSS.escape(turn)}"]`)
}

/**
 * Reveal the native actions for one transcript row without moving any rows.
 * @param sessionId - the conversation that owns the current pointer interaction.
 * @returns Transient pointer handlers for the embedded transcript.
 */
export function useMessageActionReveal(sessionId: string) {
  const frameRef = useRef<HTMLDivElement>(null)
  const active = useRef<Element | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const enabled = typeof document !== 'undefined'
    && document.documentElement.matches('[data-dsh-embedded][data-dsh-compact-chat]')
  const reveal = useCallback((owner: Element | null): void => {
    clearTimeout(closeTimer.current)
    if (active.current === owner) return
    active.current?.removeAttribute(OPEN)
    active.current = owner
    owner?.setAttribute(OPEN, '')
  }, [])
  useEffect(() => {
    const frame = frameRef.current
    if (frame === null) return
    // The browser can emit pointerleave without pointerout when exiting an iframe.
    const leave = (event: PointerEvent): void => {
      if (event.pointerType !== 'touch') reveal(null)
    }
    frame.addEventListener('pointerleave', leave)
    return () => {
      frame.removeEventListener('pointerleave', leave)
      reveal(null)
    }
  }, [enabled, reveal, sessionId])

  if (!enabled) return undefined
  return {
    ref: frameRef,
    onPointerOver(event: ReactPointerEvent<HTMLDivElement>) {
      if (event.pointerType === 'touch') return
      const owner = actionOwner(event.target, event.currentTarget)
      if (owner !== null) reveal(owner)
    },
    onPointerOut(event: ReactPointerEvent<HTMLDivElement>) {
      if (event.pointerType === 'touch' || active.current === null
        || actionOwner(event.target, event.currentTarget) !== active.current
        || actionOwner(event.relatedTarget, event.currentTarget) === active.current) return
      // Bridge the space between the reply and its separate action row.
      clearTimeout(closeTimer.current)
      closeTimer.current = setTimeout(() => { reveal(null) }, TRANSFER_MS)
    },
    onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
      const target = event.target
      if (event.pointerType !== 'touch' || !(target instanceof Element)
        || target.closest('button, a, input, textarea, [role="button"], [contenteditable="true"]') !== null) return
      const owner = actionOwner(target, event.currentTarget)
      reveal(owner === active.current ? null : owner)
    },
  }
}
