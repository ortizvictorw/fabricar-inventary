import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BudgetService, Budget } from '../../services/budget.service';
import { ProductService, Product } from '../../services/product.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-budget-add',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './budget-add.component.html'
})
export default class BudgetAddComponent implements OnInit {
  budgetForm!: FormGroup;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProducts: Product[] = [];
  totalPrice: number = 0;
  searchQuery: string = '';
  selectedProduct: Product | null = null;
  minDate: string = '';
  constructor(
    private fb: FormBuilder,
    private budgetService: BudgetService,
    private productService: ProductService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.minDate = new Date().toISOString().split('T')[0]; // Fecha de hoy en formato YYYY-MM-DD

    this.budgetForm = this.fb.group({
      observation: ['', Validators.required],
      clientName: [''],
      sellerName: [''],
      validityDate: ['', Validators.required],
      priceAdjustment: [0]
    });

    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(products => {
      this.products = products;
    });
  }

  filterProducts(): void {
    this.filteredProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
  }

  addProduct(product: Product): void {
    this.selectProduct(product)

    if (this.selectedProduct) {
      this.selectedProducts.push(this.selectedProduct);
      this.totalPrice += this.selectedProduct.price;
      this.selectedProduct = null;
      this.searchQuery = '';
      this.filteredProducts = [];
    }
  }

  removeProduct(index: number): void {
    this.totalPrice -= this.selectedProducts[index].price;
    this.selectedProducts.splice(index, 1);
  }

  calculateFinalPrice(): number {
    const adjustment = this.budgetForm.get('priceAdjustment')?.value || 0;
    return this.totalPrice + (this.totalPrice * adjustment) / 100;
  }

  submitBudget(): void {
    if (this.budgetForm.invalid) {
      Swal.fire('Error', 'Por favor complete los campos obligatorios', 'error');
      return;
    }

    const newBudget: Budget = {
      observation: this.budgetForm.value.observation,
      client: this.budgetForm.value.clientName,
      operator: this.budgetForm.value.sellerName,
      validity: this.budgetForm.value.validityDate,
      finalPrice: this.calculateFinalPrice(),
      enabled: true,
      createdAt: new Date().toISOString(),
      products: this.selectedProducts
    };

    this.budgetService.addBudget(newBudget).then(() => {
      Swal.fire('Éxito', 'Presupuesto creado correctamente', 'success');
      this.router.navigate(['/budget']);
    }).catch(error => {
      Swal.fire('Error', 'No se pudo crear el presupuesto', 'error');
      console.error(error);
    });
  }
}
