import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MovimientoService } from '../movimiento.service';
import { Movement, MovementAudit } from '../movimiento.model';
import { CategoriaService } from '../../categorias/categoria.service';
import { Category } from '../../categorias/categoria.model';

@Component({
  selector: 'app-detalle-movimiento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.scss'
})
export class DetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movimientoService = inject(MovimientoService);
  private categoriaService = inject(CategoriaService);

  movimiento = signal<Movement | null>(null);
  categoria = signal<Category | null>(null);
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  auditoria = signal<MovementAudit[]>([]);
  auditoriaLoading = signal(false);
  auditoriaError = signal<string | null>(null);

  private origenQueryParams: Record<string, string | null> = {};

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    this.origenQueryParams = {
      start: query.get('start'),
      end: query.get('end'),
      category_id: query.get('category_id')
    };

    const estado = history.state as { movimiento?: Movement };
    if (estado?.movimiento) {
      this.movimiento.set(estado.movimiento);
      this.cargarCategoria(estado.movimiento.category_id);
      this.cargarAuditoria(estado.movimiento.id);
      return;
    }

    this.buscarPorId();
  }

  private buscarPorId(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMsg.set('Movimiento no encontrado');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);

    // El backend no expone GET /movements/{id}; se busca en un rango amplio
    // cuando se entra directo por URL sin pasar por el listado.
    this.movimientoService.list({ start: '2000-01-01', end: '2100-12-31' }).subscribe({
      next: (movimientos) => {
        const encontrado = movimientos.find((m) => m.id === id) ?? null;
        this.movimiento.set(encontrado);
        this.loading.set(false);
        if (!encontrado) {
          this.errorMsg.set('Movimiento no encontrado');
        } else {
          this.cargarCategoria(encontrado.category_id);
          this.cargarAuditoria(encontrado.id);
        }
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('No se pudo cargar el movimiento');
      }
    });
  }

  private cargarCategoria(categoryId: number): void {
    this.categoriaService.list().subscribe({
      next: (categorias) => {
        this.categoria.set(categorias.find((c) => c.id === categoryId) ?? null);
      }
    });
  }

  private cargarAuditoria(movementId: number): void {
    this.auditoriaLoading.set(true);
    this.auditoriaError.set(null);

    this.movimientoService.getAudit(movementId).subscribe({
      next: (entradas) => {
        this.auditoria.set(entradas);
        this.auditoriaLoading.set(false);
      },
      error: () => {
        this.auditoriaLoading.set(false);
        this.auditoriaError.set('No se pudo cargar el historial de auditoría');
      }
    });
  }

  formatearValor(cents: number): string {
    return (cents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  formatearFecha(iso: string): string {
    return new Date(iso).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  etiquetaAccion(action: MovementAudit['action']): string {
    switch (action) {
      case 'create': return 'Creación';
      case 'update': return 'Edición';
      case 'delete': return 'Anulación';
      default: return action;
    }
  }

  volver(): void {
    const queryParams: Record<string, string> = {};
    if (this.origenQueryParams['start']) queryParams['start'] = this.origenQueryParams['start']!;
    if (this.origenQueryParams['end']) queryParams['end'] = this.origenQueryParams['end']!;
    if (this.origenQueryParams['category_id']) queryParams['category_id'] = this.origenQueryParams['category_id']!;

    this.router.navigate(['/movimientos'], { queryParams });
  }
}
