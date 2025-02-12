import { Component, OnInit, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms'; // ✅ Importamos FormsModule para el filtro
import { Product, ProductService } from '../../services/product.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule], // ✅ Agregamos FormsModule
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

    // Aplicar filtro en tiempo real sin afectar la suscripción original
    this.products$.subscribe(products => {
      this.filteredProducts = products;
    });
  }

  applyFilter() {
    this.products$.subscribe(products => {
      const query = this.searchQuery.toLowerCase();
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
}
