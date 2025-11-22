import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../shared/services/common.service';

@Component({
  selector: 'app-landing-about',
  templateUrl: './landing-about.component.html',
  styleUrl: './landing-about.component.css'
})
export class LandingAboutComponent implements OnInit{
  constructor(
    private commonService: CommonService
  ) { }

  ngOnInit(): void {
    
  }

  navigateToPage(path: string) {
    this.commonService.navigateToPage(path, false);
  }
}
