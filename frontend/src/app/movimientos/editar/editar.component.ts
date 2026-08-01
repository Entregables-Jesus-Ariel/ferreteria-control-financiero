import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MovimientoService } from '../movimiento.service';
import { Movement } from '../movimiento.model';
import { CategoriaService } from '../../categorias/categoria.service';
import { Category } from '../../categorias/categoria.model';

@Component({
  selector: 'app-editar-movimiento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss'
})
export class EditarComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movimientoService = inject(MovimientoService);
  private categoriaService = inject(CategoriaService);

  categorias = signal<Category[]>([]);
  loading = signal(false);
  guardando = signal(false);
  errorMsg = signal<string | null>(null);
  movimientoId = signal<number | null>(null);

  form = this.fb.group({
    date: ['', Validators.required],
    categoryId: [null as number | null, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    note: ['']
  });

  ngOnInit(): void {
    this.categoriaService.list().subscribe({
      next: (categorias) => this.categorias.set(categorias)
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.movimientoId.set(id);

    const estado = history.state as { movimiento?: Movement };
    if (estado?.movimiento) {
      this.prellenar(estado.movimiento);
      return;
    }

    this.buscarPorId(id);
  }

  private buscarPorId(id: number): void {
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
        const encontrado = movimientos.find((m) => m.id === id);
        this.loading.set(false);
        if (!encontrado) {
          this.errorMsg.set('Movimiento no encontrado');
          return;
        }
        this.prellenar(encontrado);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('No se pudo cargar el movimiento');
      }
    });
  }

  private prellenar(movimiento: Movement): void {
    this.form.patchValue({
      date: movimiento.date,
      categoryId: movimiento.category_id,
      amount: movimiento.amount_cents / 100,
      note: movimiento.note
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // TODO [HU-007]: conectar con MovimientoService.update (PUT /api/movements/{id})
  }

  cancelar(): void {
    this.router.navigate(['/movimientos']);
  }
}
