import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaService } from './categoria.service';
import { Category, CategoryType } from './categoria.model';

type FiltroTipo = CategoryType | 'all';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.scss'
})
export class CategoriasComponent implements OnInit {
  private categoriaService = inject(CategoriaService);

  categorias = signal<Category[]>([]);
  filtro = signal<FiltroTipo>('all');
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cambiarFiltro(tipo: FiltroTipo): void {
    this.filtro.set(tipo);
    this.cargar();
  }

  protected cargar(): void {
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
