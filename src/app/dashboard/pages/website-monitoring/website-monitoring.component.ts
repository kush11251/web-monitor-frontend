import { Component } from '@angular/core';

@Component({
  selector: 'app-website-monitoring',
  templateUrl: './website-monitoring.component.html',
  styleUrl: './website-monitoring.component.css'
})
export class WebsiteMonitoringComponent {
  cards = [
    {
      icon: 'fa-solid fa-server',
      iconColor: 'text-blue-400',
      value: '24',
      label: 'Active Monitors',
      change: '+12%',
      changeColor: 'text-green-400'
    },
    {
      icon: 'fa-solid fa-chart-line',
      iconColor: 'text-purple-400',
      value: '99.2%',
      label: 'Avg Uptime',
      change: '99.8%',
      changeColor: 'text-green-400'
    },
    {
      icon: 'fa-solid fa-stopwatch',
      iconColor: 'text-pink-400',
      value: '142ms',
      label: 'Avg Response',
      change: '-8ms',
      changeColor: 'text-green-400'
    },
    {
      icon: 'fa-solid fa-triangle-exclamation',
      iconColor: 'text-yellow-400',
      value: '3',
      label: 'Incidents',
      change: '2 Active',
      changeColor: 'text-red-400'
    }
  ];

  cardWidgets = [
    {
      "nameTag": "api.example.com",
      "nameSubTag": "Production API",
      "responseTime": 87,
      "uptime": 99.8,
      "status": "Online"
    },
    {
      "nameTag": "auth.example.com",
      "nameSubTag": "Authentication Service",
      "responseTime": 120,
      "uptime": 99.6,
      "status": "Online"
    },
    {
      "nameTag": "payments.example.com",
      "nameSubTag": "Payment Gateway",
      "responseTime": 95,
      "uptime": 99.9,
      "status": "Online"
    },
    {
      "nameTag": "analytics.example.com",
      "nameSubTag": "Analytics Engine",
      "responseTime": 110,
      "uptime": 99.7,
      "status": "Online"
    },
    {
      "nameTag": "search.example.com",
      "nameSubTag": "Search Service",
      "responseTime": 78,
      "uptime": 99.5,
      "status": "Online"
    },
    {
      "nameTag": "notifications.example.com",
      "nameSubTag": "Notification Service",
      "responseTime": 132,
      "uptime": 99.3,
      "status": "Online"
    },
    {
      "nameTag": "storage.example.com",
      "nameSubTag": "Storage Service",
      "responseTime": 102,
      "uptime": 99.8,
      "status": "Online"
    },
    {
      "nameTag": "media.example.com",
      "nameSubTag": "Media CDN",
      "responseTime": 88,
      "uptime": 99.9,
      "status": "Online"
    },
    {
      "nameTag": "billing.example.com",
      "nameSubTag": "Billing API",
      "responseTime": 115,
      "uptime": 99.6,
      "status": "Online"
    },
    {
      "nameTag": "chat.example.com",
      "nameSubTag": "Chat Service",
      "responseTime": 90,
      "uptime": 99.7,
      "status": "Online"
    }
  ];

  showPopup = false;
  newService = { url: '', subTag: '' };

  addNewWidget() {
    this.openPopup();
  }

  openPopup() {
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
    this.newService = { url: '', subTag: '' }; // reset form
  }

  submitForm() {
    if (!this.newService.url || !this.newService.subTag) return;

    // Add logic to push to your services array
    console.log('New Service:', this.newService);

    // Close popup after submission
    this.closePopup();
  }
}
