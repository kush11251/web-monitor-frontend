import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { inject } from '@vercel/analytics';

import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'web-monitor-frontend';

  ngOnInit(): void {
    console.log("Environment Name: ", environment.production ? 'Production' : 'Development');

    inject();
  }
}
