import { NgModule } from '@angular/core';

import { AuthRoutingModule } from './auth-routing.module';
import { sharedImports } from '../shared/imports/shared_imports';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';


@NgModule({
  declarations: [
    LoginComponent,
    SignupComponent
  ],
  imports: [
    AuthRoutingModule,
    sharedImports
  ]
})
export class AuthModule { }
