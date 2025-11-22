import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingAboutComponent } from './pages/landing-about/landing-about.component';
import { LandingHomeComponent } from './pages/landing-home/landing-home.component';

const routes: Routes = [
  { path: '', component: LandingHomeComponent },
  { path: 'about', component: LandingAboutComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandingRoutingModule { }
