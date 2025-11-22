import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card-widget',
  templateUrl: './card-widget.component.html',
  styleUrl: './card-widget.component.css'
})
export class CardWidgetComponent implements OnInit{
  nameTag = '';
  nameSubTag = '';
  responseTime = 0;
  uptime = 0.0;
  status = 'Online';

  @Input() data!: any;

  ngOnInit(): void {
    console.log(this.data);

    this.nameTag = this.data.nameTag;
    this.nameSubTag = this.data.nameSubTag;
    this.status = this.data.status;
    this.uptime = this.data.uptime;
    this.responseTime = this.data.responseTime;
  }
}
