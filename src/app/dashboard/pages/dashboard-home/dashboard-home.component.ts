import { Component, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css'
})
export class DashboardHomeComponent implements OnDestroy{
  websiteUrl: string = '';
  websites: { url: string; canEmbed: boolean; timestamp: number }[] = [];

  previewSite: string | null = null;

  private refreshInterval: any;

  constructor() {
    // Set interval to refresh every 5 seconds
    this.refreshInterval = setInterval(() => {
      this.websites = this.websites.map(site => ({
        ...site,
        timestamp: Date.now() // update timestamp to force iframe reload
      }));
    }, 15000); // 15 seconds
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  addWebsite() {
    let url = this.websiteUrl.trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    this.websites.push({ url, canEmbed: true, timestamp: Date.now() });
    this.websiteUrl = '';
  }

  removeWebsite(index: number) {
    this.websites.splice(index, 1);
  }

  openPreview(site: string) {
    this.previewSite = site;
  }

  closePreview() {
    this.previewSite = null;
  }

  iframeLoadError(site: { url: string; canEmbed: boolean }) {
    site.canEmbed = false;
  }

  openInNewTab(url: string) {
    window.open(url, '_blank');
  }
}
