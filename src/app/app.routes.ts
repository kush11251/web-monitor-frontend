import { Routes } from '@angular/router';

export const routes: Routes = [
{
    path: '',
    loadChildren: () =>
      import('./landing/landing.module').then(m => m.LandingModule)
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.module').then(m => m.AuthModule)
  }
];
