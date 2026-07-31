import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriaService } from './categoria.service';
import { Category, CategoryType } from './categoria.model';

type FiltroTipo = CategoryType | 'all';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.scss'
})
export class CategoriasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);

  categorias = signal<Category[]>([]);
  filtro = signal<FiltroTipo>('all');
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  creando = signal(false);
  createErrorMsg = signal<string | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    type: ['income' as CategoryType, Validators.required]
  });

  ngOnInit(): void {
    this.cargar();
  }

  cambiarFiltro(tipo: FiltroTipo): void {
    this.filtro.set(tipo);
    this.cargar();
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.creando.set(true);
    this.createErrorMsg.set(null);

    const { name, type } = this.form.value;

    this.categoriaService.create(name!, type as CategoryType).subscribe({
      next: () => {
        this.creando.set(false);
        this.form.reset({ name: '', type: 'income' });
        this.cargar();
      },
      error: () => {
        this.creando.set(false);
        this.createErrorMsg.set('No se pudo crear la categoría');
      }
    });
  }

  private cargar(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    const tipo = this.filtro();
    this.categoriaService.list(tipo === 'all' ? undefined : tipo).subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudieron cargar las categorías');
        this.loading.set(false);
      }
    });
  }
}
