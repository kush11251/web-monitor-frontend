import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardHomeComponent } from './pages/dashboard-home/dashboard-home.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { WebsiteMonitoringComponent } from './pages/website-monitoring/website-monitoring.component';

const routes: Routes = [
  { path: '', component: DashboardHomeComponent },
  { path: 'monitoring', component: WebsiteMonitoringComponent },
  { path: 'settings', component: SettingsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
