import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, computed, ElementRef, HostListener, inject, NgZone, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AiChatService } from '../../core/services/ai-chat/ai-chat.service';
import { Subject, takeUntil } from 'rxjs';
import { AIChatSession, AIUsageStats } from '../../core/models/interfaces/ai-chat/ai-chat.interface';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface ChatMessageUI {
  id?: number | string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  displayContent: string;   // streamed/typed content shown in UI
  timestamp: Date;
  isError?: boolean;
  isLoading?: boolean;
  isTyping?: boolean;       // true while streaming effect runs
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule,
    MatTooltipModule, MatProgressSpinnerModule
  ],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss'
})
export class AiChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private aiService  = inject(AiChatService);
  private router     = inject(Router);
  private sanitizer  = inject(DomSanitizer);
  private zone       = inject(NgZone);
  private destroy$   = new Subject<void>();
 
  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;
  @ViewChild('inputRef')    private inputRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('chatPanel')   private chatPanel!: ElementRef;
 
  // ── UI state ──────────────────────────────────────────────────────────────
  isOpen          = signal(false);
  isSidebarOpen   = signal(false);
  isLoading       = signal(false);
  isExpanded      = signal(false);    // compact → expanded panel
 
  currentSessionId = signal<string | undefined>(undefined);
  messages         = signal<ChatMessageUI[]>([]);
  sessions         = signal<AIChatSession[]>([]);
  usageStats       = signal<AIUsageStats | null>(null);
 
  inputText        = signal('');
  contextType      = signal<string | undefined>(undefined);
 
  editingSessionId = signal<string | null>(null);
  editingTitle     = signal('');
 
  hoveredSessionId = signal<string | null>(null);
 
  private shouldScroll = false;
  private typingTimers: ReturnType<typeof setTimeout>[] = [];
 
  // ── Computed ──────────────────────────────────────────────────────────────
  canSend = computed(() => this.inputText().trim().length > 0 && !this.isLoading());
 
  tokenPct = computed(() => {
    const s = this.usageStats();
    return s ? Math.round((s.todayTokens / s.dailyTokenLimit) * 100) : 0;
  });
 
  readonly suggestionChips = [
    'How many assets do we have?',
    'Show pending approvals',
    'Recent electronics assets',
    'Assets assigned to a user',
    'What roles exist?',
    'Explain asset depreciation',
  ];
 
  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit()        { this.loadSessions(); this.loadUsageStats(); }
  ngOnDestroy()     { this.destroy$.next(); this.destroy$.complete(); this.clearTypingTimers(); }
  ngAfterViewChecked() {
    if (this.shouldScroll) { this.scrollBottom(); this.shouldScroll = false; }
  }
 
  // ── Toggle / Open / Close ─────────────────────────────────────────────────
  toggleChat() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) setTimeout(() => this.inputRef?.nativeElement?.focus(), 200);
    else { this.isSidebarOpen.set(false); this.isExpanded.set(false); }
  }
 
  toggleSidebar() { this.isSidebarOpen.update(v => !v); }
 
  toggleExpand() { this.isExpanded.update(v => !v); }
 
  openFullPage() { this.router.navigate(['/ai-chat']); }
 
  newChat() {
    this.currentSessionId.set(undefined);
    this.messages.set([]);
    this.isSidebarOpen.set(false);
    setTimeout(() => this.inputRef?.nativeElement?.focus(), 100);
  }
 
  openSession(session: AIChatSession) {
    this.currentSessionId.set(session.sessionId);
    this.isSidebarOpen.set(false);
    this.messages.set([]);
    this.aiService.getSessionDetail(session.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: detail => {
          this.messages.set(detail.messages.map(m => ({
            id: m.id, role: m.role,
            content: m.content, displayContent: m.content,
            timestamp: new Date(m.timestamp), isError: m.isError,
            isTyping: false
          })));
          this.shouldScroll = true;
        },
        error: () => this.pushError('Could not load conversation.')
      });
  }
 
  // ── Send message ──────────────────────────────────────────────────────────
  sendMessage() {
    const text = this.inputText().trim();
    if (!text || this.isLoading()) return;
 
    const userMsg: ChatMessageUI = {
      id: `u-${Date.now()}`, role: 'user',
      content: text, displayContent: text,
      timestamp: new Date()
    };
    const loadingMsg: ChatMessageUI = {
      id: `l-${Date.now()}`, role: 'assistant',
      content: '', displayContent: '',
      timestamp: new Date(), isLoading: true
    };
 
    this.messages.update(m => [...m, userMsg, loadingMsg]);
    this.inputText.set('');
    this.isLoading.set(true);
    this.shouldScroll = true;
    this.resetHeight();
 
    this.aiService.sendMessage({
      message: text,
      sessionId: this.currentSessionId(),
      contextType: this.contextType(),
      includeLiveData: true
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: resp => {
        this.currentSessionId.set(resp.sessionId);
        const aiMsg: ChatMessageUI = {
          id: resp.messageId, role: 'assistant',
          content: resp.reply, displayContent: '',
          timestamp: new Date(resp.timestamp), isTyping: true
        };
        this.messages.update(msgs => [...msgs.filter(m => !m.isLoading), aiMsg]);
        this.isLoading.set(false);
        this.shouldScroll = true;
        this.streamType(resp.messageId.toString(), resp.reply);
        this.loadSessions();
        this.loadUsageStats();
      },
      error: (err: Error) => {
        this.messages.update(msgs => msgs.filter(m => !m.isLoading).concat({
          role: 'assistant', content: err.message,
          displayContent: err.message,
          timestamp: new Date(), isError: true, isTyping: false
        }));
        this.isLoading.set(false);
        this.shouldScroll = true;
      }
    });
  }
 
  // ── Streaming typewriter effect ───────────────────────────────────────────
  private streamType(msgId: string, fullText: string) {
    const charsPerFrame = 3;   // characters revealed per tick
    const delay = 12;          // ms between ticks — adjust for speed
    let i = 0;
 
    const tick = () => {
      if (i >= fullText.length) {
        this.zone.run(() => {
          this.messages.update(msgs => msgs.map(m =>
            m.id?.toString() === msgId
              ? { ...m, displayContent: fullText, isTyping: false }
              : m
          ));
        });
        return;
      }
      i = Math.min(i + charsPerFrame, fullText.length);
      this.zone.run(() => {
        this.messages.update(msgs => msgs.map(m =>
          m.id?.toString() === msgId
            ? { ...m, displayContent: fullText.slice(0, i) }
            : m
        ));
        this.shouldScroll = true;
      });
      const t = setTimeout(tick, delay);
      this.typingTimers.push(t);
    };
    tick();
  }
 
  private clearTypingTimers() {
    this.typingTimers.forEach(clearTimeout);
    this.typingTimers = [];
  }
 
  // ── Input handlers ────────────────────────────────────────────────────────
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }
  onInput(e: Event) {
    const ta = e.target as HTMLTextAreaElement;
    this.inputText.set(ta.value);
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }
 
  // ── Session actions ───────────────────────────────────────────────────────
  deleteSession(s: AIChatSession, e: Event) {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    this.aiService.deleteSession(s.sessionId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.sessions.update(list => list.filter(x => x.sessionId !== s.sessionId));
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
    this.editingSessionId.set(s.sessionId);
    this.editingTitle.set(s.title);
  }
 
  confirmRename(s: AIChatSession) {
    const t = this.editingTitle().trim();
    if (!t) { this.cancelRename(); return; }
    this.aiService.renameSession(s.sessionId, t).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.sessions.update(list => list.map(x => x.sessionId === s.sessionId ? { ...x, title: t } : x));
        this.cancelRename();
      }
    });
  }
 
  cancelRename() { this.editingSessionId.set(null); this.editingTitle.set(''); }
 
  // ── Markdown renderer ─────────────────────────────────────────────────────
  renderContent(content: string): SafeHtml {
    if (!content) return this.sanitizer.bypassSecurityTrustHtml('');
    let html = content
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/```[\w]*\n?([\s\S]*?)```/g,'<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g,'<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/^### (.+)$/gm,'<h4>$1</h4>')
      .replace(/^## (.+)$/gm,'<h3>$1</h3>')
      .replace(/^# (.+)$/gm,'<h2>$1</h2>')
      .replace(/^\| (.+)$/gm, (_, row) => {
        if (row.includes('---')) return '';
        const cells = row.split('|').map((c: string) => c.trim());
        return '<tr>' + cells.map((c: string) => `<td>${c}</td>`).join('') + '</tr>';
      })
      .replace(/(<tr>[\s\S]+?<\/tr>)/g,'<table>$1</table>')
      .replace(/^\s*[-*] (.+)$/gm,'<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/^\d+\. (.+)$/gm,'<li>$1</li>')
      .replace(/^---+$/gm,'<hr>')
      .replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>');
    if (!html.match(/<(p|ul|h\d|pre|table)/)) html = `<p>${html}</p>`;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
 
  // ── Formatters ────────────────────────────────────────────────────────────
  formatTime(d: Date|string): string {
    return new Date(d).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  }
  formatDate(s: string): string {
    const d = new Date(s), now = new Date();
    const diff = Math.floor((now.getTime()-d.getTime())/86400000);
    if (diff===0) return 'Today';
    if (diff===1) return 'Yesterday';
    if (diff<7)   return d.toLocaleDateString([],{weekday:'long'});
    return d.toLocaleDateString([],{month:'short',day:'numeric'});
  }
  trackByMsg(_: number, m: ChatMessageUI) { return m.id; }
  trackBySess(_: number, s: AIChatSession) { return s.sessionId; }
 
  // ── Private ───────────────────────────────────────────────────────────────
  private loadSessions()   { this.aiService.getSessions().pipe(takeUntil(this.destroy$)).subscribe({next:s=>this.sessions.set(s)}); }
  private loadUsageStats() { this.aiService.getUsageStats().pipe(takeUntil(this.destroy$)).subscribe({next:s=>this.usageStats.set(s)}); }
  private scrollBottom()   { try { this.messagesEnd?.nativeElement?.scrollIntoView({behavior:'smooth'}); } catch {} }
  private pushError(msg: string) { this.messages.update(m=>[...m,{role:'assistant',content:msg,displayContent:msg,timestamp:new Date(),isError:true}]); }
  private resetHeight()    { if (this.inputRef?.nativeElement) this.inputRef.nativeElement.style.height='auto'; }
 
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isSidebarOpen()) this.isSidebarOpen.set(false);
    else if (this.isExpanded()) this.isExpanded.set(false);
  }
}
