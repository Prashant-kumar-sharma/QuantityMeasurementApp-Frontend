import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {

  constructor(private http: HttpClient) {}

  // ✅ ADD withCredentials
  getHistory(): Observable<{ action: string; result: string }[]> {
    return this.http.get<{ action: string; result: string }[]>(
      '/api/history',
      { withCredentials: true }
    );
  }

  // ✅ ADD withCredentials
  saveHistory(data: { action: string; result: string }): Observable<any> {
    return this.http.post(
      '/api/history',
      data,
      { withCredentials: true }
    );
  }
}