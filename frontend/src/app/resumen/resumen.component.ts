import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumenService } from './resumen.service';
import { Granularidad, Summary } from './resumen.model';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.scss'
})
export class ResumenComponent implements OnInit {
  private resumenService = inject(ResumenService);

  granularidad = signal<Granularidad>('monthly');
  resumen = signal<Summary | null>(null);
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  seleccionarGranularidad(granularidad: Granularidad): void {
    this.granularidad.set(granularidad);
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    this.resumenService.get(this.granularidad()).subscribe({
      next: (resumen) => {
        this.resumen.set(resumen);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudo cargar el resumen');
        this.loading.set(false);
      }
    });
  }

  formatearValor(cents: number): string {
    return (cents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }
}
