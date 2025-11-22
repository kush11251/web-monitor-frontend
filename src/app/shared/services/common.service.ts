import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor(
    private route: Router
  ) { }

  navigateToPage(page: string, clearPreviousData: boolean = false) {

    if (clearPreviousData) {
      // First navigate to root and replace history
      this.route.navigate(['/'], { replaceUrl: true }).then(() => {
        // Now navigate to the target page, also replacing history
        this.route.navigate([page], { replaceUrl: true });
      });
    } else {
      // Normal navigation
      this.route.navigate([page]);
    }
  }
}
