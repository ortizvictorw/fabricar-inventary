import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Product, ProductService } from '../../services/product.service';
import { Category, CategoryService } from '../../services/category.service';

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

  onSubmit() {
    if (this.productForm.valid) {
      this.productService.addProduct(this.productForm.value)
        .then(() => {
          alert('Producto agregado correctamente');
          this.router.navigate(['/product']); // Redirigir después de actualizar
        })
        .catch(error => {
          console.error('Error al agregar el producto:', error);
          alert('Hubo un error al agregar el producto.');
        });
    } else {
      alert('Por favor, completa todos los campos correctamente.');
    }
  }
}
