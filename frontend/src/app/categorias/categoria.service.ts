import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category, CategoryType } from './categoria.model';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categories`;

  list(type?: CategoryType): Observable<Category[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<Category[]>(this.baseUrl, { params });
  }

  create(name: string, type: CategoryType): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, { name, type });
  }
}
