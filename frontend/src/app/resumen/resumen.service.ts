import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Granularidad, Summary } from './resumen.model';

@Injectable({ providedIn: 'root' })
export class ResumenService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/summary`;

  get(granularidad: Granularidad): Observable<Summary> {
    const params = new HttpParams().set('granularity', granularidad);
    return this.http.get<Summary>(this.baseUrl, { params });
  }
}
