import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Product, ProductService } from '../../services/product.service';
import { Category, CategoryService } from '../../services/category.service';
import { catchError, take } from 'rxjs/operators';

@Component({
  selector: 'app-product-edit.',
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
        alert('No se pudo cargar el producto.');
        this.router.navigate(['/product']); // Redirigir si el producto no existe
        return of(undefined);
      })
    );

    this.product$.subscribe(product => {
      if (product) {
        this.productForm.patchValue(product);
      } else {
        alert('El producto no fue encontrado.');
        this.router.navigate(['/product']);
      }
    });
  }

  onSubmit() {
    if (this.productForm.valid) {
      const updatedProduct: Product = { ...this.productForm.value, id: this.productId };

      this.productService.updateProduct(updatedProduct)
        .then(() => {
          alert('Producto actualizado correctamente ✅');
          this.router.navigate(['/product']);
        })
        .catch(error => {
          console.error('Error al actualizar el producto:', error);
          alert('Hubo un error al actualizar el producto. Intenta de nuevo.');
        });
    } else {
      alert('Por favor, completa todos los campos correctamente.');
    }
  }
}
