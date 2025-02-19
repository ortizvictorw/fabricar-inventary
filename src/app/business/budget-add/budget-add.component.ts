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
  selectedProducts: { product: Product, quantity: number }[] = [];
  totalPrice: number = 0;
  searchQuery: string = '';
  minDate: string = '';

  constructor(
    private fb: FormBuilder,
    private budgetService: BudgetService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.minDate = new Date().toISOString().split('T')[0]; // Fecha de hoy en formato YYYY-MM-DD

    // Se agregan los validadores para que todos los campos sean obligatorios
    this.budgetForm = this.fb.group({
      observation: [''],
      clientName: ['', Validators.required],
      sellerName: ['', Validators.required],
      validityDate: ['', Validators.required],
      priceAdjustment: [0, [Validators.min(0)]]
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

  addProduct(product: Product): void {
    const existingProduct = this.selectedProducts.find(p => p.product.id === product.id);
    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      this.selectedProducts.push({ product, quantity: 1 });
    }
    this.updateTotalPrice();
    this.searchQuery = '';
    this.filteredProducts = [];
  }

  removeProduct(index: number): void {
    this.selectedProducts.splice(index, 1);
    this.updateTotalPrice();
  }

  updateQuantity(index: number, event: any): void {
    let quantity = event.target.value;
    if (quantity < 1) {
      quantity = 1;
    }
    this.selectedProducts[index].quantity = quantity;
    this.updateTotalPrice();
  }

  updateTotalPrice(): void {
    this.totalPrice = this.selectedProducts.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }

  calculateFinalPrice(): number {
    const adjustment = this.budgetForm.get('priceAdjustment')?.value || 0;
    return this.totalPrice + (this.totalPrice * adjustment) / 100;
  }

  submitBudget(): void {
    if (this.budgetForm.invalid) {
      Swal.fire('Error', 'Por favor complete todos los campos obligatorios', 'error');
      return;
    }

    if (this.selectedProducts.length === 0) {
      Swal.fire('Error', 'Debe agregar al menos un producto al presupuesto', 'error');
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
      products: this.selectedProducts.map(p => ({ ...p.product, quantity: p.quantity }))
    };

    this.budgetService.addBudget(newBudget).then(() => {
      Swal.fire('Éxito', 'Presupuesto creado correctamente', 'success');
      this.router.navigate(['/budget']);
    }).catch(error => {
      Swal.fire('Error', 'No se pudo crear el presupuesto', 'error');
      console.error(error);
    });
  }

  // Función auxiliar para mostrar errores en el formulario
  getErrorMessage(field: string): string {
    if (this.budgetForm.get(field)?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (this.budgetForm.get(field)?.hasError('min')) {
      return 'El valor debe ser mayor o igual a 0';
    }
    return '';
  }
}
