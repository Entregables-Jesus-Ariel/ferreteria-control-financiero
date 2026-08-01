import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';
import { CategoriasComponent } from './categorias/categorias.component';
import { RegistrarIngresoComponent } from './movimientos/registrar-ingreso/registrar-ingreso.component';
import { RegistrarEgresoComponent } from './movimientos/registrar-egreso/registrar-egreso.component';
import { ListadoComponent } from './movimientos/listado/listado.component';
import { DetalleComponent } from './movimientos/detalle/detalle.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'categorias', component: CategoriasComponent },
      { path: 'movimientos/ingreso', component: RegistrarIngresoComponent },
      { path: 'movimientos/egreso', component: RegistrarEgresoComponent },
      { path: 'movimientos/detalle/:id', component: DetalleComponent },
      { path: 'movimientos', component: ListadoComponent }
    ]
  }
];
