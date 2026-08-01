import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateMovementRequest, Movement } from './movimiento.model';

@Injectable({ providedIn: 'root' })
export class MovimientoService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/movements`;

  create(request: CreateMovementRequest): Observable<Movement> {
    return this.http.post<Movement>(this.baseUrl, request);
  }
}
