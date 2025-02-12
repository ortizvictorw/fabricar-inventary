import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule, NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { StockService, Stock } from '../../services/stock.service';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, NgFor, RouterLink, RouterLinkActive,FormsModule], // ✅ Importamos módulos necesarios
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css'],
  animations: [
    trigger('slideInOut', [
      state('open', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      state('closed', style({
        opacity: 0,
        transform: 'translateY(-10px)'
      })),
      transition('open <=> closed', animate('200ms ease-in-out'))
    ])
  ]
})
export default class StockComponent implements OnInit, OnDestroy {
  stocks: Stock[] = [];
  filteredStocks: Stock[] = [];
  searchQuery: string = '';
  open = false;
  private destroy$ = new Subject<void>(); // 🚀 Para manejar la suscripción de manera segura

  constructor(private stockService: StockService) {}

  ngOnInit() {
    // 🔄 Obtener los datos de stock desde Firestore y suscribirse de manera segura
    this.stockService.getStocks()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.stocks = data;
          this.filteredStocks = data; // Inicialmente, sin filtro
        },
        (error) => {
          console.error('Error al obtener los datos de stock:', error);
        }
      );
  }

  applyFilter() {
    const query = this.searchQuery.toLowerCase();
    this.filteredStocks = this.stocks.filter(stock => 
      stock.name.toLowerCase().includes(query)
    );
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

  ngOnDestroy() {
    // 🚀 Evitar fugas de memoria cancelando la suscripción
    this.destroy$.next();
    this.destroy$.complete();
  }
}
