import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { Budget, BudgetService } from '../../services/budget.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductionService } from '../../services/production.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './budget.component.html',
  animations: [
    trigger('slideInOut', [
      state('open', style({ opacity: 1, transform: 'translateY(0)' })),
      state('closed', style({ opacity: 0, transform: 'translateY(-10px)' })),
      transition('open <=> closed', animate('200ms ease-in-out'))
    ])
  ]
})
export default class BudgetComponent implements OnInit, OnDestroy {
  budget$!: Observable<Budget[]>;
  filteredBudgets: Budget[] = [];
  searchQuery: string = '';
  open = false;
  private subscription!: Subscription;
  selectedStatus: string = 'all';

  constructor(private budgetService: BudgetService, private productionService: ProductionService) { }

  ngOnInit() {
    this.budget$ = this.budgetService.getBudget();
    this.subscription = this.budget$.subscribe(budgets => {
      this.filteredBudgets = budgets;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  applyFilter() {
    const query = this.searchQuery.toLowerCase();
    const statusFilter = this.selectedStatus;

    this.subscription = this.budget$.subscribe(budgets => {
      this.filteredBudgets = budgets.filter(budget => {
        const matchesQuery = budget.observation.toLowerCase().includes(query);
        const matchesStatus = statusFilter === 'all' ||
          (statusFilter === 'enabled' && budget.enabled) ||
          (statusFilter === 'disabled' && !budget.enabled);
        return matchesQuery && matchesStatus;
      });
    });
  }

  toggleOpen() {
    this.open = !this.open;
  }

  isBudgetExpired(validity: string): boolean {
    const today = new Date();
    const budgetDate = new Date(validity);
    return budgetDate < today;
  }

  confirmOrder(id?: string) {
    if (id) {

      this.productionService.confirmBudget(id).subscribe(() => {
        this.filteredBudgets = this.filteredBudgets.filter(budget => budget.id !== id);
      });
      Swal.fire({
        icon: 'success',
        title: 'Presupuesto confirmado',
        text: 'El presupuesto ha sido confirmado con éxito.'
      });

    }
  }

  discardOrder(id?: string) {
    if (id) {

      this.productionService.discardBudget(id).subscribe(() => {
        this.filteredBudgets = this.filteredBudgets.filter(budget => budget.id !== id);
      });
      Swal.fire({
        icon: 'success',
        title: 'Presupuesto descartado',
        text: 'El presupuesto ha sido descartado con éxito.'
      });
    }
  }
  generatePDF(budget: Budget) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const marginX = 10;
    const imgWidth = pageWidth - 2 * marginX;
    const imgHeight = imgWidth / 2;

    const img = new Image();
    img.src = 'assets/logo-completo.jpeg';
    img.onload = () => {
      const imgY = 5;
      doc.addImage(img, 'jpeg', marginX, imgY, imgWidth, imgHeight);
      const headerY = imgY + imgHeight + 10;
      doc.setFontSize(18);
      doc.text('Presupuesto', pageWidth / 2, headerY, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Cliente: ${budget.client}`, marginX, headerY + 15);
      doc.text(`Vendedor: ${budget.operator}`, marginX, headerY + 25);
      doc.text(`Fecha de vigencia: ${budget.validity}`, marginX, headerY + 35);
      let tableStartY = headerY + 45;
      if (budget.products && budget.products.length > 0) {
        autoTable(doc, {
          startY: tableStartY,
          head: [['Producto', 'Descripción', 'Categoria', 'Cantidad', 'Precio unitario', 'Total']],
          body: budget.products.map(p => [p.name, p.description, p.category, p.quantity ?? 0, `${p.price} ARS`, `${p.price * (p.quantity ?? 0)} ARS`]),
          theme: 'grid',
          styles: { halign: 'center' }
        });
      } else {
        doc.text('No hay productos en este presupuesto.', marginX, tableStartY);
      }
      const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 10;
      doc.setFontSize(14);
      doc.text(`Total: ${budget.finalPrice} ARS`, marginX, finalY + 15);
      doc.save(`Presupuesto_${budget.client}.pdf`);
    };
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-content') && !target.closest('button')) {
      this.open = false;
    }
  }
}