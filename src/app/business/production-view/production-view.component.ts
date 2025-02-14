import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ProductionService, Budget } from '../../services/production.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-production-view',
  templateUrl: './production-view.component.html',
  styleUrls: ['./production-view.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export default class ProductionViewComponent implements OnInit {
  budget$!: Observable<Budget | undefined>;
  budgetId!: string;

  constructor(private route: ActivatedRoute, private productionService: ProductionService) {}

  ngOnInit() {
    this.budgetId = this.route.snapshot.paramMap.get('id') || '';
    if (this.budgetId) {
      this.budget$ = this.productionService.getBudgetById(this.budgetId);
    }
  }
}
