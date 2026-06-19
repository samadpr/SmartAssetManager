import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AIChatRequest, AIChatResponse, AIChatSession, AISessionDetail, AIUsageStats } from '../../models/interfaces/ai-chat/ai-chat.interface';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { catchError, map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ai`;

  sendMessage(req: AIChatRequest): Observable<AIChatResponse> {
    return this.http
      .post<ApiResponse<AIChatResponse>>(`${this.base}/chat`, req)
      .pipe(
        map(r => {
          if (!r.success) throw new Error(r.message);
          return r.data!;
        }),
        catchError(this.handleError)
      );
  }
    getSessions(page = 1, pageSize = 20): Observable<AIChatSession[]> {
    return this.http
      .get<ApiResponse<AIChatSession[]>>(`${this.base}/sessions`, {
        params: { page, pageSize }
      })
      .pipe(map(r => r.data ?? []), catchError(this.handleError));
  }
 
  getSessionDetail(sessionId: string): Observable<AISessionDetail> {
    return this.http
      .get<ApiResponse<AISessionDetail>>(`${this.base}/sessions/${sessionId}`)
      .pipe(map(r => r.data!), catchError(this.handleError));
  }
 
  deleteSession(sessionId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/sessions/${sessionId}`)
      .pipe(map(() => void 0), catchError(this.handleError));
  }
 
  renameSession(sessionId: string, title: string): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/sessions/${sessionId}/rename`, { title })
      .pipe(map(() => void 0), catchError(this.handleError));
  }
 
  pinSession(sessionId: string, pin: boolean): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/sessions/${sessionId}/pin`, null, {
        params: { pin: String(pin) }
      })
      .pipe(map(() => void 0), catchError(this.handleError));
  }
 
  getUsageStats(): Observable<AIUsageStats> {
    return this.http
      .get<ApiResponse<AIUsageStats>>(`${this.base}/usage-stats`)
      .pipe(map(r => r.data!), catchError(this.handleError));
  }
 
  private handleError(err: HttpErrorResponse) {
    const msg =
      err.status === 429
        ? err.error?.message ?? 'Rate limit reached. Please slow down.'
        : err.error?.message ?? 'Something went wrong. Please try again.';
    return throwError(() => new Error(msg));
  }
}
