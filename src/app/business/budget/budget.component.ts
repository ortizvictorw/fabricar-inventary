import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { Budget, BudgetService } from '../../services/budget.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  selectedStatus: string = 'all'; // 🔹 Se agrega esta propiedad con un valor por defecto

  constructor(private budgetService: BudgetService) {}

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

  generatePDF(budget: Budget) {
    const doc = new jsPDF();

    // Cargar el logo y generar el PDF solo después de que cargue
    const img = new Image();
    img.src = 'assets/logo.png'; // Asegúrate de que el logo esté en formato PNG
    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 40, 20);

      // Encabezado del documento
      doc.setFontSize(18);
      doc.text('Presupuesto', 80, 20);
      doc.setFontSize(12);
      doc.text(`Cliente: ${budget.client}`, 10, 40);
      doc.text(`Vendedor: ${budget.operator}`, 10, 50);
      doc.text(`Fecha de vigencia: ${budget.validity}`, 10, 60);

      // Verificar que budget.products no sea undefined ni vacío
      if (budget.products && budget.products.length > 0) {
        // Tabla de productos
        autoTable(doc, {
          startY: 70,
          head: [['Producto', 'Precio unitario']],
          body: budget.products.map(p => [
            p.name,
            `${p.price} ARS`,
          ]),
          theme: 'grid'
        });
      } else {
        doc.text('No hay productos en este presupuesto.', 10, 75);
      }

      // Obtener la posición final de la tabla
      const finalY = (doc as any).lastAutoTable?.finalY || 80;

      // Agregar información extra después de la tabla
      doc.setFontSize(14);
      doc.text(`Total: ${budget.finalPrice} ARS`, 10, finalY + 10);

      // Descargar el PDF
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
