import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../models/interfaces/ApiResponse.interface';
import { Subscription, Subscriptions, SubscriptionsRequest } from '../../../models/admin/subscriptions.interface';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionsService {

  private baseUrl = `${environment.apiUrl}/admin/subscription`;

  constructor(private http: HttpClient) { }


  // CREATE SUBSCRIPTION
  createSubscription(companyId: number, data: SubscriptionsRequest): Observable<ApiResponse<Subscriptions>> {
    return this.http.post<ApiResponse<Subscriptions>>(
      `${this.baseUrl}/create?companyId=${companyId}`,
      data
    );
  }

  // UPDATE
  updateSubscription(companyId: number, data: SubscriptionsRequest): Observable<ApiResponse<Subscriptions>> {
    return this.http.put<ApiResponse<Subscriptions>>(
      `${this.baseUrl}/update?companyId=${companyId}`,
      data
    );
  }

  // GET BY ID
  getSubscriptionById(id: number): Observable<ApiResponse<Subscriptions>> {
    return this.http.get<ApiResponse<Subscriptions>>(
      `${this.baseUrl}/get-by-id?id=${id}`
    );
  }

  // GET ALL
  getAllSubscriptions(): Observable<ApiResponse<Subscriptions[]>> {
    return this.http.get<ApiResponse<Subscriptions[]>>(
      `${this.baseUrl}/get-all`
    );
  }

  getSubscriptionsByCustom(isCustom: boolean) {
    return this.http.get<any>(
      `${this.baseUrl}/get-by-custom?isCustom=${isCustom}`
    );
  }

  // DELETE
  deleteSubscription(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/delete?id=${id}`
    );
  }
}
