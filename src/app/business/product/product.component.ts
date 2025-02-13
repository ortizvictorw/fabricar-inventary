import { Component, OnInit, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product, ProductService } from '../../services/product.service';
import { Observable } from 'rxjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
  animations: [
    trigger('slideInOut', [
      state('open', style({ opacity: 1, transform: 'translateY(0)' })),
      state('closed', style({ opacity: 0, transform: 'translateY(-10px)' })),
      transition('open <=> closed', animate('200ms ease-in-out'))
    ])
  ]
})
export default class ProductComponent implements OnInit {
  products$!: Observable<Product[]>;
  filteredProducts: Product[] = [];
  searchQuery: string = '';
  open = false;

  constructor(private productService: ProductService, private router: Router) {}

  ngOnInit() {
    this.products$ = this.productService.getProducts();
    this.products$.subscribe(products => (this.filteredProducts = products));
  }

  applyFilter() {
    const query = this.searchQuery.toLowerCase();
    this.products$.subscribe(products => {
      this.filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(query)
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

  editItem(id: string) {
    this.router.navigate(['/product-edit', id]);
  }

  // 🔥 Exportar datos a Excel
  exportToExcel() {
    if (this.filteredProducts.length === 0) {
      alert('No hay productos para exportar.');
      return;
    }

    const data = this.filteredProducts.map(({ name, description, category, price, available }) => ({
      Producto: name,
      Descripción: description,
      Categoría: category,
      Precio: price,
      Disponible: available ? 'Sí' : 'No'
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, 'Listado_Productos.xlsx');
  }
}
