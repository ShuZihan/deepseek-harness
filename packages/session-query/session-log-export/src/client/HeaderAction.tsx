import { Button, IconDownloadOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SessionLogDownloadState } from './controller.ts'

export interface HeaderActionInjected {
  readonly label: string
  readonly hooks: { readonly downloadState: ObservableSnapshot<SessionLogDownloadState> }
  readonly download: (sessionId: SessionId) => Promise<void>
}

/** The optional direct download entry for a carrier's Session header. */
export function SessionLogDownloadHeaderAction({ sessionId, label, useDownloadState, download }:
  PropsRuntime<'conversation.session.header.utilities'> & InjectFace<HeaderActionInjected>) {
  const busy = useDownloadState(state => state.bySession[sessionId]?.status === 'downloading')
  return <Button size="sm" variant="outline" disabled={busy} aria-busy={busy}
    onClick={() => { void download(sessionId) }}>
    <span>{label}</span><IconDownloadOutlineRegular size={12} />
  </Button>
}
