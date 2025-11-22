import { NgModule } from '@angular/core';

import { LandingRoutingModule } from './landing-routing.module';
import { sharedImports } from '../shared/imports/shared_imports';

import { AboutSectionComponent } from './components/about-section/about-section.component';
import { ContactSectionComponent } from './components/contact-section/contact-section.component';
import { FeaturesSectionComponent } from './components/features-section/features-section.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';

import { LandingAboutComponent } from './pages/landing-about/landing-about.component';
import { LandingHomeComponent } from './pages/landing-home/landing-home.component';


@NgModule({
  declarations: [
    AboutSectionComponent,
    ContactSectionComponent,
    FeaturesSectionComponent,
    HeroSectionComponent,

    LandingAboutComponent,
    LandingHomeComponent,
  ],
  imports: [
    LandingRoutingModule,
    sharedImports,
  ]
})
export class LandingModule { }
