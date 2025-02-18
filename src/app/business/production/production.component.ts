import { Component, OnInit, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, take } from 'rxjs';
import { Budget, ProductionService } from '../../services/production.service';
import Swal from 'sweetalert2';

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

  constructor(private productionService: ProductionService, private router: Router) { }

  ngOnInit() {
    this.budgets$ = this.productionService.getConfirmedBudgets();
    this.budgets$.subscribe({
      next: budgets => {
        this.filteredBudgets = budgets;
      },
      error: err => {
        console.error('Error al obtener presupuestos:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los presupuestos.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  applyFilter() {
    this.budgets$.pipe(take(1)).subscribe({
      next: budgets => {
        const query = this.searchQuery.toLowerCase();
        this.filteredBudgets = budgets.filter(budget =>
          budget.observation.toLowerCase().includes(query) ||
          budget.client.toLowerCase().includes(query)
        );

        // Notificación con SweetAlert2
        Swal.fire({
          icon: 'info',
          title: 'Filtro aplicado',
          text: `Se encontraron ${this.filteredBudgets.length} resultados.`,
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: err => {
        console.error('Error al filtrar:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo aplicar el filtro.',
          timer: 2000,
          showConfirmButton: false
        });
      }
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
    if (id) {
      this.router.navigate(['/production-view', id]);
    }
  }

  confirmWork(id?: string) {
    if (!id) return;

    Swal.fire({
      title: 'Confirmar acción',
      text: '¿Estás seguro de que quieres confirmar este presupuesto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, confirmarlo'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productionService.confirmBudgetAndCreateBalance(id).pipe(take(1)).subscribe({
          next: () => {
            this.filteredBudgets = this.filteredBudgets.filter(budget => budget.id !== id);
            Swal.fire({
              icon: 'success',
              title: 'Presupuesto confirmado',
              text: 'El presupuesto fue confirmado y enviado para su producción',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error('Error al confirmar presupuesto:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.message || 'Hubo un problema al confirmar el presupuesto.',
              confirmButtonText: 'Aceptar'
            });
          }
        });

      }
    });
  }
}
