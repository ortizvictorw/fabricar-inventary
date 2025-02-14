import { Component, OnInit, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Budget, ProductionService } from '../../services/production.service';

@Component({
  selector: 'app-production',
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './production.component.html',
  styleUrls: ['./production.component.css'],
  standalone: true,
  animations: [
    trigger('slideInOut', [
      state('open', style({ opacity: 1, transform: 'translateY(0)' })),
      state('closed', style({ opacity: 0, transform: 'translateY(-10px)' })),
      transition('open <=> closed', animate('200ms ease-in-out'))
    ])
  ]
})
export default class ProductionComponent implements OnInit {
  budgets$!: Observable<Budget[]>;
  filteredBudgets: Budget[] = [];
  searchQuery: string = '';
  open = false;

  constructor(private productionService: ProductionService, private router: Router) {}

  ngOnInit() {
    this.budgets$ = this.productionService.getConfirmedBudgets();
    this.budgets$.subscribe(budgets => {
      this.filteredBudgets = budgets;
    });
  }

  applyFilter() {
    this.budgets$.subscribe(budgets => {
      const query = this.searchQuery.toLowerCase();
      this.filteredBudgets = budgets.filter(budget => 
        budget.observation.toLowerCase().includes(query) ||
        budget.client.toLowerCase().includes(query)
      );
    });
  }

  toggleOpen() {
    this.open = !this.open;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-content') && !target.closest('button')) {
      this.open = false;
    }
  }

  viewProducts(id?: string) {
    if(id){
      this.router.navigate(['/production-view', id]);
    }
  }

  confirmWork(id?: string) {
    if(id){
      this.productionService.confirmBudget(id).subscribe(() => {
        this.filteredBudgets = this.filteredBudgets.filter(budget => budget.id !== id);
      });
    }
  }
}
