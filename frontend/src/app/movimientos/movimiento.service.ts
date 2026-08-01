import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateMovementRequest, Movement } from './movimiento.model';

export interface ListMovementParams {
  start: string;
  end: string;
  categoryId?: number;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class MovimientoService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/movements`;

  create(request: CreateMovementRequest): Observable<Movement> {
    return this.http.post<Movement>(this.baseUrl, request);
  }

  update(id: number, request: CreateMovementRequest): Observable<Movement> {
    return this.http.put<Movement>(`${this.baseUrl}/${id}`, request);
  }

  list(params: ListMovementParams): Observable<Movement[]> {
    let httpParams = new HttpParams()
      .set('start', params.start)
      .set('end', params.end);

    if (params.categoryId) {
      httpParams = httpParams.set('category_id', params.categoryId.toString());
    }
    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.pageSize) {
      httpParams = httpParams.set('page_size', params.pageSize.toString());
    }

    return this.http.get<Movement[]>(this.baseUrl, { params: httpParams });
  }

  anular(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
