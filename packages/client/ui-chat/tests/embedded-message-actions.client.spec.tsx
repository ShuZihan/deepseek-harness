// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useMessageActionReveal } from '../src/client/chat/use-message-action-reveal.ts'

function Fixture({ sessionId = 'session-a' }: { sessionId?: string }) {
  const handlers = useMessageActionReveal(sessionId)
  return (
    <div {...handlers} data-testid="chat">
      <div data-message-action-owner data-testid="user">Question</div>
      <div data-chat-turn="1">
        <div data-chat-flow-kind="assistant-step" data-chat-turn="1" data-testid="answer">
          <a href="#file">Open file</a>
        </div>
      </div>
      <div data-message-action-owner data-turn-tail="1" data-testid="first-actions">First turn</div>
      <div data-message-action-owner data-turn-tail="2" data-testid="second-actions">Second turn</div>
      <div data-testid="gap" />
    </div>
  )
}

beforeEach(() => {
  document.documentElement.setAttribute('data-dsh-embedded', '')
  document.documentElement.setAttribute('data-dsh-compact-chat', '')
  // This test environment lacks the browser's CSS.escape implementation.
  vi.stubGlobal('CSS', { escape: (value: string) => value })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute('data-dsh-embedded')
  document.documentElement.removeAttribute('data-dsh-compact-chat')
})

function pointer(
  target: HTMLElement, type: 'pointerover' | 'pointerout' | 'pointerup' | 'pointerleave', pointerType: 'mouse' | 'touch',
  relatedTarget?: HTMLElement,
) {
  const event = new MouseEvent(type, { bubbles: type !== 'pointerleave', relatedTarget: relatedTarget ?? null })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  fireEvent(target, event)
}

const isOpen = (element: HTMLElement) => element.hasAttribute('data-message-actions-open')

it('associates an answer with its own turn through the gap to its actions', () => {
  vi.useFakeTimers()
  const ui = render(<Fixture />)
  const answer = ui.getByTestId('answer')
  const gap = ui.getByTestId('gap')
  const first = ui.getByTestId('first-actions')
  const second = ui.getByTestId('second-actions')
  pointer(answer, 'pointerover', 'mouse')
  expect(isOpen(first)).toBe(true)
  expect(isOpen(second)).toBe(false)
  pointer(answer, 'pointerout', 'mouse', gap)
  pointer(first, 'pointerover', 'mouse', gap)
  act(() => { vi.runAllTimers() })
  expect(isOpen(first)).toBe(true)
  pointer(first, 'pointerout', 'mouse', gap)
  act(() => { vi.runAllTimers() })
  expect(isOpen(first)).toBe(false)
  pointer(answer, 'pointerover', 'mouse')
  pointer(ui.getByTestId('chat'), 'pointerleave', 'mouse')
  expect(isOpen(first)).toBe(false)
})

it('lets touch toggle one row and clears it upon switching sessions', () => {
  const ui = render(<Fixture />)
  const user = ui.getByTestId('user')
  const answer = ui.getByTestId('answer')
  const first = ui.getByTestId('first-actions')
  pointer(user, 'pointerup', 'touch')
  expect(isOpen(user)).toBe(true)
  pointer(ui.getByRole('link'), 'pointerup', 'touch')
  expect(isOpen(user)).toBe(true)
  expect(isOpen(first)).toBe(false)
  pointer(answer, 'pointerup', 'touch')
  expect(isOpen(user)).toBe(false)
  expect(isOpen(first)).toBe(true)
  pointer(answer, 'pointerup', 'touch')
  expect(isOpen(first)).toBe(false)
  pointer(user, 'pointerup', 'touch')
  ui.rerender(<Fixture sessionId="session-b" />)
  expect(isOpen(user)).toBe(false)
})
