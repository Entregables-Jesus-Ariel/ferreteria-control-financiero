import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriaService } from '../../categorias/categoria.service';
import { Category } from '../../categorias/categoria.model';
import { MovimientoService } from '../movimiento.service';

@Component({
  selector: 'app-registrar-egreso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registrar-egreso.component.html',
  styleUrl: './registrar-egreso.component.scss'
})
export class RegistrarEgresoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);
  private movimientoService = inject(MovimientoService);

  categorias = signal<Category[]>([]);
  loadingCategorias = signal(false);

  guardando = signal(false);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  form = this.fb.group({
    date: ['', Validators.required],
    categoryId: [null as number | null, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    note: ['']
  });

  ngOnInit(): void {
    this.cargarCategorias();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.successMsg.set(null);
    this.errorMsg.set(null);

    const { date, categoryId, amount, note } = this.form.value;

    this.movimientoService.create({
      category_id: categoryId!,
      date: date!,
      amount_cents: Math.round(amount! * 100),
      note: note ?? ''
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.successMsg.set('Egreso registrado correctamente');
        this.form.reset({ date: '', categoryId: null, amount: null, note: '' });
      },
      error: () => {
        this.guardando.set(false);
        this.errorMsg.set('No se pudo registrar el egreso');
      }
    });
  }

  private cargarCategorias(): void {
    this.loadingCategorias.set(true);
    this.categoriaService.list('expense').subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.loadingCategorias.set(false);
      },
      error: () => {
        this.loadingCategorias.set(false);
      }
    });
  }
}
