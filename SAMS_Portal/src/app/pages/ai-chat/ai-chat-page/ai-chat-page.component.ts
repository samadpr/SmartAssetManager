import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  signal, computed, inject, AfterViewChecked, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AiChatService } from '../../../core/services/ai-chat/ai-chat.service';
import { AIChatSession, AIUsageStats } from '../../../core/models/interfaces/ai-chat/ai-chat.interface';

export interface FullChatMessageUI {
  id?: number | string;
  role: 'user' | 'assistant';
  content: string;
  displayContent: string;
  timestamp: Date;
  isError?: boolean;
  isLoading?: boolean;
  isTyping?: boolean;
}

@Component({
  selector: 'app-ai-chat-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDividerModule
  ],
  templateUrl: './ai-chat-page.component.html',
  styleUrl: './ai-chat-page.component.scss'
})
export class AiChatPageComponent implements OnInit, OnDestroy, AfterViewChecked {
  private aiService = inject(AiChatService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private zone = inject(NgZone);
  private destroy$ = new Subject<void>();

  @ViewChild('msgEnd') private msgEnd!: ElementRef;
  @ViewChild('inputRef') private inputRef!: ElementRef<HTMLTextAreaElement>;

  // ── State ──────────────────────────────────────────────────────────────────
  isLoading = signal(false);
  currentSessionId = signal<string | undefined>(undefined);
  messages = signal<FullChatMessageUI[]>([]);
  sessions = signal<AIChatSession[]>([]);
  usageStats = signal<AIUsageStats | null>(null);
  inputText = signal('');
  searchText = signal('');

  editingId = signal<string | null>(null);
  editingTitle = signal('');
  hoveredId = signal<string | null>(null);

  private shouldScroll = false;
  private typingTimers: ReturnType<typeof setTimeout>[] = [];

  // ── Computed ───────────────────────────────────────────────────────────────
  canSend = computed(() => this.inputText().trim().length > 0 && !this.isLoading());

  tokenPct = computed(() => {
    const s = this.usageStats();
    return s ? Math.round((s.todayTokens / s.dailyTokenLimit) * 100) : 0;
  });

  filteredSessions = computed(() => {
    const q = this.searchText().toLowerCase().trim();
    if (!q) return this.sessions();
    return this.sessions().filter(s =>
      s.title.toLowerCase().includes(q) ||
      (s.lastMessage ?? '').toLowerCase().includes(q)
    );
  });

  currentSessionTitle = computed(() => {
    const s = this.sessions().find(x => x.sessionId === this.currentSessionId());
    return s?.title ?? 'Conversation';
  });


  readonly suggestionChips = [
    'How many assets do we have?',
    'Show all pending approvals',
    'Electronics category assets',
    'What roles are configured?',
    'Explain depreciation methods',
    'Assets assigned to a user',
    'List all departments',
    'Search for damaged assets',
  ];

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit() { this.loadSessions(); this.loadUsageStats(); }
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); this.clearTimers(); }
  ngAfterViewChecked() {
    if (this.shouldScroll) { this.scrollBottom(); this.shouldScroll = false; }
  }

  goBack() { this.router.navigate(['/dashboard']); }

  // ── Session management ────────────────────────────────────────────────────
  newChat() {
    this.currentSessionId.set(undefined);
    this.messages.set([]);
    setTimeout(() => this.inputRef?.nativeElement?.focus(), 50);
  }

  openSession(s: AIChatSession) {
    this.currentSessionId.set(s.sessionId);
    this.messages.set([]);
    this.aiService.getSessionDetail(s.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: detail => {
          this.messages.set(detail.messages.map(m => ({
            id: m.id, role: m.role,
            content: m.content, displayContent: m.content,
            timestamp: new Date(m.timestamp),
            isError: m.isError, isTyping: false
          })));
          this.shouldScroll = true;
        }
      });
  }

  deleteSession(s: AIChatSession, e: Event) {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    this.aiService.deleteSession(s.sessionId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.sessions.update(l => l.filter(x => x.sessionId !== s.sessionId));
        if (this.currentSessionId() === s.sessionId) this.newChat();
      }
    });
  }

  pinSession(s: AIChatSession, e: Event) {
    e.stopPropagation();
    this.aiService.pinSession(s.sessionId, !s.isPinned)
      .pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.loadSessions() });
  }

  startRename(s: AIChatSession, e: Event) {
    e.stopPropagation();
    this.editingId.set(s.sessionId);
    this.editingTitle.set(s.title);
  }

  confirmRename(s: AIChatSession) {
    const t = this.editingTitle().trim();
    if (!t) { this.cancelRename(); return; }
    this.aiService.renameSession(s.sessionId, t).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.sessions.update(l => l.map(x => x.sessionId === s.sessionId ? { ...x, title: t } : x));
        this.cancelRename();
      }
    });
  }
  cancelRename() { this.editingId.set(null); this.editingTitle.set(''); }

  // ── Send ──────────────────────────────────────────────────────────────────
  sendMessage() {
    const text = this.inputText().trim();
    if (!text || this.isLoading()) return;

    const userMsg: FullChatMessageUI = {
      id: `u-${Date.now()}`, role: 'user',
      content: text, displayContent: text, timestamp: new Date()
    };
    const loadingMsg: FullChatMessageUI = {
      id: `l-${Date.now()}`, role: 'assistant',
      content: '', displayContent: '', timestamp: new Date(), isLoading: true
    };

    this.messages.update(m => [...m, userMsg, loadingMsg]);
    this.inputText.set('');
    this.isLoading.set(true);
    this.shouldScroll = true;
    this.resetHeight();

    this.aiService.sendMessage({
      message: text, sessionId: this.currentSessionId(),
      includeLiveData: true
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: resp => {
        this.currentSessionId.set(resp.sessionId);
        const aiMsg: FullChatMessageUI = {
          id: resp.messageId, role: 'assistant',
          content: resp.reply, displayContent: '',
          timestamp: new Date(resp.timestamp), isTyping: true
        };
        this.messages.update(msgs => [...msgs.filter(m => !m.isLoading), aiMsg]);
        this.isLoading.set(false);
        this.shouldScroll = true;
        this.streamType(resp.messageId.toString(), resp.reply);
        this.loadSessions(); this.loadUsageStats();
      },
      error: (err: Error) => {
        this.messages.update(msgs => msgs.filter(m => !m.isLoading).concat({
          role: 'assistant', content: err.message, displayContent: err.message,
          timestamp: new Date(), isError: true, isTyping: false
        }));
        this.isLoading.set(false);
        this.shouldScroll = true;
      }
    });
  }

  // ── Typewriter ────────────────────────────────────────────────────────────
  private streamType(msgId: string, full: string) {
    let i = 0;
    const tick = () => {
      if (i >= full.length) {
        this.zone.run(() => {
          this.messages.update(m => m.map(x =>
            x.id?.toString() === msgId ? { ...x, displayContent: full, isTyping: false } : x));
        });
        return;
      }
      i = Math.min(i + 4, full.length);
      this.zone.run(() => {
        this.messages.update(m => m.map(x =>
          x.id?.toString() === msgId ? { ...x, displayContent: full.slice(0, i) } : x));
        this.shouldScroll = true;
      });
      this.typingTimers.push(setTimeout(tick, 10));
    };
    tick();
  }
  private clearTimers() { this.typingTimers.forEach(clearTimeout); this.typingTimers = []; }

  // ── Input ─────────────────────────────────────────────────────────────────
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }
  onInput(e: Event) {
    const ta = e.target as HTMLTextAreaElement;
    this.inputText.set(ta.value);
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  }

  // ── Markdown ──────────────────────────────────────────────────────────────
  renderContent(content: string): SafeHtml {
    if (!content) return this.sanitizer.bypassSecurityTrustHtml('');
    let html = content
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/^\| (.+)$/gm, (_, row) => {
        if (row.includes('---')) return '';
        const cells = row.split('|').map((c: string) => c.trim());
        return '<tr>' + cells.map((c: string) => `<td>${c}</td>`).join('') + '</tr>';
      })
      .replace(/(<tr>[\s\S]+?<\/tr>)/g, '<table>$1</table>')
      .replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/^---+$/gm, '<hr>')
      .replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
    if (!html.match(/<(p|ul|h\d|pre|table)/)) html = `<p>${html}</p>`;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatTime(d: Date | string): string {
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  formatDate(s: string): string {
    const d = new Date(s), now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return d.toLocaleDateString([], { weekday: 'long' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  trackByMsg(_: number, m: FullChatMessageUI) { return m.id; }
  trackBySess(_: number, s: AIChatSession) { return s.sessionId; }

  private loadSessions() { this.aiService.getSessions().pipe(takeUntil(this.destroy$)).subscribe({ next: s => this.sessions.set(s) }); }
  private loadUsageStats() { this.aiService.getUsageStats().pipe(takeUntil(this.destroy$)).subscribe({ next: s => this.usageStats.set(s) }); }
  private scrollBottom() { try { this.msgEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' }); } catch { } }
  private resetHeight() { if (this.inputRef?.nativeElement) this.inputRef.nativeElement.style.height = 'auto'; }
}
