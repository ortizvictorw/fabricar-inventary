import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Product, ProductService } from '../../services/product.service';
import { Category, CategoryService } from '../../services/category.service';
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
  categories$: Observable<Category[]> = new Observable(); // 📌 Cargar categorías desde BD

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(1)]], // ✅ Validación del precio mayor a 0
      available: [false],
      category: ['', [Validators.required]] // ✅ Categoría obligatoria
    });
  }

  ngOnInit(): void {
    this.categories$ = this.categoryService.getCategories(); // 🔄 Obtener categorías dinámicamente
  }

  // ✅ Mensaje de éxito con SweetAlert2
  showSuccessMessage(title: string, message: string) {
    Swal.fire({
      title: title,
      text: message,
      icon: 'success',
      confirmButtonText: 'OK',
      background: '#1f2937',
      color: '#ffffff',
      confirmButtonColor: '#22C55E', // Verde éxito
      timer: 2500
    });
  }

  // ✅ Mensaje de error con SweetAlert2
  showErrorMessage(title: string, message: string) {
    Swal.fire({
      title: title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      background: '#1f2937',
      color: '#ffffff',
      confirmButtonColor: '#EF4444' // Rojo error
    });
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.showErrorMessage('Formulario incompleto', 'Por favor, completa todos los campos correctamente.');
      return;
    }

    this.productService.addProduct(this.productForm.value)
      .then(() => {
        this.showSuccessMessage('Producto agregado', 'El producto fue agregado correctamente.');
        this.router.navigate(['/product']); // Redirigir después de agregar
      })
      .catch(error => {
        console.error('Error al agregar el producto:', error);
        this.showErrorMessage('Error en el proceso', 'Hubo un problema al agregar el producto.');
      });
  }
}
