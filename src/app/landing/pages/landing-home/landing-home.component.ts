import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../shared/services/common.service';

@Component({
  selector: 'app-landing-home',
  templateUrl: './landing-home.component.html',
  styleUrl: './landing-home.component.css'
})
export class LandingHomeComponent implements OnInit{
  menuOpen = false;

  constructor(
    private commonService: CommonService
  ) {}

  ngOnInit(): void {
    
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  navigateToPage(path: string) {
    this.commonService.navigateToPage(path, false);
  }
}
