import { NgModule } from '@angular/core';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { sharedImports } from '../shared/imports/shared_imports';

import { CardWidgetComponent } from './components/card-widget/card-widget.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

import { DashboardHomeComponent } from './pages/dashboard-home/dashboard-home.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { WebsiteMonitoringComponent } from './pages/website-monitoring/website-monitoring.component';


@NgModule({
  declarations: [
    CardWidgetComponent,
    HeaderComponent,
    SidebarComponent,

    DashboardHomeComponent,
    SettingsComponent,
    WebsiteMonitoringComponent
  ],
  imports: [
    DashboardRoutingModule,
    sharedImports
  ]
})
export class DashboardModule { }
