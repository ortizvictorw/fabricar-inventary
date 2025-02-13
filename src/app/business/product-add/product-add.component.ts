import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CategoryService, Category } from '../../services/category.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-add',
  templateUrl: './product-add.component.html',
  styleUrls: ['./product-add.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule] // ✅ Usamos ReactiveFormsModule
})
export default class ProductAddComponent implements OnInit {
  productForm: FormGroup;
  categories$: Observable<Category[]> = new Observable();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(1)]], // ✅ Validación del precio mayor a 0
      available: [false],
      category: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.categories$ = this.categoryService.getCategories();
  }

  // ✅ Mensaje de éxito con SweetAlert2
  showSuccessMessage(title: string, message: string) {
    Swal.fire({
      title,
      text: message,
      icon: 'success',
      confirmButtonText: 'OK',
      background: '#1f2937',
      color: '#ffffff',
      confirmButtonColor: '#22C55E',
      timer: 2500
    });
  }

  // ✅ Mensaje de error con SweetAlert2
  showErrorMessage(title: string, message: string) {
    Swal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      background: '#1f2937',
      color: '#ffffff',
      confirmButtonColor: '#EF4444'
    });
  }

  async onSubmit() {
    if (this.productForm.invalid) {
      this.showErrorMessage('Formulario incompleto', 'Por favor, completa todos los campos correctamente.');
      return;
    }

    try {
      await this.productService.addProduct(this.productForm.value);
      this.showSuccessMessage('Producto agregado', `El producto "${this.productForm.value.name}" fue agregado correctamente.`);
      this.router.navigate(['/product']);
      this.productForm.reset({ available: false });
    } catch (error) {
      console.error('Error al agregar el producto:', error);
      this.showErrorMessage('Error en el proceso', 'Hubo un problema al agregar el producto.');
    }
  }
}
