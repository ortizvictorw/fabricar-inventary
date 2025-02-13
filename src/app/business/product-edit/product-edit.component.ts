import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Product, ProductService } from '../../services/product.service';
import { Category, CategoryService } from '../../services/category.service';
import { catchError, take } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-edit',
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export default class EditProductComponent implements OnInit {
  productForm: FormGroup;
  productId!: string;
  categories$: Observable<Category[]> = of([]);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(1)]],
      available: [false],
      category: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // 🔄 Obtener categorías
    this.categories$ = this.categoryService.getCategories().pipe(
      catchError(error => {
        console.error('Error al obtener categorías:', error);
        this.showErrorMessage('Error', 'No se pudieron cargar las categorías.');
        return of([]);
      })
    );

    // 📌 Obtener ID del producto desde la URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.productId = id;
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: string) {
    this.productService.getProductById(id).pipe(
      take(1),
      catchError(error => {
        console.error(`Error al obtener el producto con ID ${id}:`, error);
        this.showErrorMessage('Error', 'No se pudo cargar el producto.');
        this.router.navigate(['/product']);
        return of(undefined);
      })
    ).subscribe(product => {
      if (product) {
        this.productForm.patchValue(product);
      } else {
        this.showErrorMessage('Producto no encontrado', 'El producto no existe o fue eliminado.');
        this.router.navigate(['/product']);
      }
    });
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
      await this.productService.updateProduct({ ...this.productForm.value, id: this.productId });
      this.showSuccessMessage('Producto actualizado', 'El producto fue actualizado correctamente.');
      this.router.navigate(['/product']);
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
      this.showErrorMessage('Error en la actualización', 'Hubo un problema al actualizar el producto.');
    }
  }
}
