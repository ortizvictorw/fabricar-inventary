import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule, NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { StockService, Stock } from '../../services/stock.service';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CategoryService, Category } from '../../services/category.service'; // Importar servicio de categorías

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, NgFor, RouterLink, RouterLinkActive, FormsModule], 
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
  categories: Category[] = [];
  searchQuery: string = '';
  selectedCategory: string = 'all'; // Estado para la categoría seleccionada
  open = false;
  private destroy$ = new Subject<void>(); 

  constructor(private stockService: StockService, private categoryService: CategoryService) {}

  ngOnInit() {
    // Obtener productos
    this.stockService.getStocks()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.stocks = data;
          this.filteredStocks = data;
        },
        (error) => {
          console.error('Error al obtener los datos de stock:', error);
        }
      );

    // Obtener categorías
    this.categoryService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (categories) => {
          this.categories = categories;
        },
        (error) => {
          console.error('Error al obtener categorías:', error);
        }
      );
  }

  applyFilter() {
    const query = this.searchQuery.toLowerCase();
    this.filteredStocks = this.stocks.filter(stock => {
      const matchesSearch = stock.name.toLowerCase().includes(query);
      const matchesCategory = this.selectedCategory === 'all' || stock.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  exportToExcel() {
    const worksheet = XLSX.utils.json_to_sheet(this.filteredStocks.map(stock => ({
      'Producto': stock.name,
      'Cantidad': stock.quantity,
      'Precio': stock.price,
      'Disponible': stock.available ? 'Sí' : 'No',
      'Categoría': stock.category || 'Sin categoría'
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(data, 'Stock.xlsx');
  }
}
