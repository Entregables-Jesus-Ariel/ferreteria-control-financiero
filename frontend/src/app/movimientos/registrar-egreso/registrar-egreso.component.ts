import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriaService } from '../../categorias/categoria.service';
import { Category } from '../../categorias/categoria.model';

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

  categorias = signal<Category[]>([]);
  loadingCategorias = signal(false);

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
    // TODO [HU-004]: conectar con MovimientoService.create (POST /api/movements)
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
