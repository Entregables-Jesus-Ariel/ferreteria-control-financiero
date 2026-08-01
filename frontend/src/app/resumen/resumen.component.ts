import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Granularidad, Summary } from './resumen.model';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.scss'
})
export class ResumenComponent {
  granularidad = signal<Granularidad>('monthly');
  resumen = signal<Summary | null>(null);
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  seleccionarGranularidad(granularidad: Granularidad): void {
    this.granularidad.set(granularidad);
    // TODO [HU-009]: conectar con SummaryService.get(granularidad) (GET /api/summary)
  }

  formatearValor(cents: number): string {
    return (cents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }
}
