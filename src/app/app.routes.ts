import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HistoryComponent } from './features/history/history.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },   // ✅ default page

  { path: 'login', component: LoginComponent },  // ✅ login when needed

  { path: 'history', component: HistoryComponent, canActivate: [authGuard] }, // ✅ protected

  { path: '**', redirectTo: '' }  // ✅ fallback to dashboard
];