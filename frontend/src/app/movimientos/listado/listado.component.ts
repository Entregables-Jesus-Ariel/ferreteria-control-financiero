import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MovimientoService } from '../movimiento.service';
import { Movement } from '../movimiento.model';
import { CategoriaService } from '../../categorias/categoria.service';
import { Category } from '../../categorias/categoria.model';

function primerDiaDelMes(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
}

function hoyISO(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-listado-movimientos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './listado.component.html',
  styleUrl: './listado.component.scss'
})
export class ListadoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private movimientoService = inject(MovimientoService);
  private categoriaService = inject(CategoriaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  movimientos = signal<Movement[]>([]);
  categorias = signal<Category[]>([]);
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  movimientoAAnular = signal<Movement | null>(null);
  anulando = signal(false);
  anularErrorMsg = signal<string | null>(null);

  categoriasPorId = computed(() => {
    const mapa = new Map<number, Category>();
    for (const categoria of this.categorias()) {
      mapa.set(categoria.id, categoria);
    }
    return mapa;
  });

  filtros = this.fb.group({
    start: [primerDiaDelMes()],
    end: [hoyISO()],
    categoryId: [null as number | null]
  });

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    const start = query.get('start');
    const end = query.get('end');
    const categoryId = query.get('category_id');

    this.filtros.patchValue({
      start: start ?? primerDiaDelMes(),
      end: end ?? hoyISO(),
      categoryId: categoryId ? Number(categoryId) : null
    });

    this.categoriaService.list().subscribe({
      next: (categorias) => this.categorias.set(categorias)
    });

    this.buscar();
  }

  buscar(): void {
    const { start, end, categoryId } = this.filtros.value;
    if (!start || !end) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        start,
        end,
        category_id: categoryId ?? null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    this.loading.set(true);
    this.errorMsg.set(null);

    this.movimientoService.list({
      start,
      end,
      categoryId: categoryId ?? undefined
    }).subscribe({
      next: (movimientos) => {
        this.movimientos.set(movimientos);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudieron cargar los movimientos');
        this.loading.set(false);
      }
    });
  }

  nombreCategoria(categoryId: number): string {
    return this.categoriasPorId().get(categoryId)?.name ?? `Categoría #${categoryId}`;
  }

  esIngreso(categoryId: number): boolean {
    return this.categoriasPorId().get(categoryId)?.type === 'income';
  }

  formatearValor(cents: number): string {
    return (cents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  private queryParamsActuales() {
    const { start, end, categoryId } = this.filtros.value;
    return { start, end, category_id: categoryId ?? null };
  }

  verDetalle(movimiento: Movement): void {
    this.router.navigate(['/movimientos/detalle', movimiento.id], {
      state: { movimiento },
      queryParams: this.queryParamsActuales()
    });
  }

  editar(movimiento: Movement): void {
    this.router.navigate(['/movimientos/editar', movimiento.id], {
      state: { movimiento },
      queryParams: this.queryParamsActuales()
    });
  }

  pedirConfirmacionAnular(movimiento: Movement): void {
    this.movimientoAAnular.set(movimiento);
    this.anularErrorMsg.set(null);
  }

  cancelarAnulacion(): void {
    if (this.anulando()) return;
    this.movimientoAAnular.set(null);
  }

  confirmarAnulacion(): void {
    const movimiento = this.movimientoAAnular();
    if (!movimiento) return;

    this.anulando.set(true);
    this.anularErrorMsg.set(null);

    this.movimientoService.anular(movimiento.id).subscribe({
      next: () => {
        this.movimientos.update((lista) =>
          lista.map((m) => (m.id === movimiento.id ? { ...m, cancelled: true } : m))
        );
        this.anulando.set(false);
        this.movimientoAAnular.set(null);
      },
      error: () => {
        this.anulando.set(false);
        this.anularErrorMsg.set('No se pudo anular el movimiento');
      }
    });
  }
}
