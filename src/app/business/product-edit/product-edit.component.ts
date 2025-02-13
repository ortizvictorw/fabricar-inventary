import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
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
  product$!: Observable<Product | undefined>;
  categories$: Observable<Category[]> = of([]); // ✅ Inicialización correcta

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(1)]],
      available: [false],
      category: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // 🔄 Obtener categorías de Firestore
    this.categories$ = this.categoryService.getCategories().pipe(
      catchError(error => {
        console.error('Error al obtener categorías:', error);
        this.showErrorMessage('Error', 'No se pudieron cargar las categorías.');
        return of([]); // Si hay error, retornamos un array vacío para evitar fallos
      })
    );

    // 📌 Obtener ID del producto desde la URL y cargarlo
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.productId = id;
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: string) {
    this.product$ = this.productService.getProductById(id).pipe(
      take(1),
      catchError(error => {
        console.error(`Error al obtener el producto con ID ${id}:`, error);
        this.showErrorMessage('Error', 'No se pudo cargar el producto.');
        this.router.navigate(['/product']); // Redirigir si el producto no existe
        return of(undefined);
      })
    );

    this.product$.subscribe(product => {
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

    const updatedProduct: Product = { ...this.productForm.value, id: this.productId };

    this.productService.updateProduct(updatedProduct)
      .then(() => {
        this.showSuccessMessage('Producto actualizado', 'El producto fue actualizado correctamente.');
        this.router.navigate(['/product']);
      })
      .catch(error => {
        console.error('Error al actualizar el producto:', error);
        this.showErrorMessage('Error en la actualización', 'Hubo un problema al actualizar el producto.');
      });
  }
}
