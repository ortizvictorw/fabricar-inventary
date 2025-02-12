import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';
import { CategoryService, Category } from '../../services/category.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-update-prices',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './update-prices.component.html',
  styleUrls: ['./update-prices.component.css']
})
export default class UpdatePricesComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  selectedCategory: string = 'all';
  percentage: number = 0;
  private productSubscription: Subscription | null = null;
  private categorySubscription: Subscription | null = null;

  constructor(private productService: ProductService, private categoryService: CategoryService) {}

  ngOnInit() {
    // Cargar productos
    this.productSubscription = this.productService.getProducts().subscribe((data) => {
      this.products = data;
      this.filteredProducts = data;
    });

    // Cargar categorías
    this.categorySubscription = this.categoryService.getCategories().subscribe((data) => {
      this.categories = data;
    });
  }

  onCategoryChange() {
    this.filteredProducts = this.selectedCategory === 'all'
      ? this.products
      : this.products.filter(p => p.category === this.selectedCategory);
  }

  calculateNewPrice(price: number): number {
    return Math.round(price + (price * this.percentage) / 100);
  }

  async applyPriceUpdate() {
    if (this.percentage <= 0) {
      alert('El porcentaje de aumento debe ser mayor a 0.');
      return;
    }

    try {
      const updatedProducts = this.filteredProducts.map(product => ({
        ...product,
        price: this.calculateNewPrice(product.price ?? 0)
      }));

      for (const product of updatedProducts) {
        await this.productService.updateProduct(product);
      }

      alert(`Precios actualizados con un ${this.percentage}% de aumento.`);
      this.percentage = 0;
    } catch (error) {
      console.error('Error al actualizar los precios:', error);
      alert('Hubo un error al actualizar los precios.');
    }
  }

  ngOnDestroy() {
    if (this.productSubscription) this.productSubscription.unsubscribe();
    if (this.categorySubscription) this.categorySubscription.unsubscribe();
  }
}
