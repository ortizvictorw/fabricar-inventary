import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, Category } from '../../services/category.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-category-add',
  standalone: true,
  imports: [CommonModule, FormsModule], // ✅ Importamos FormsModule para ngModel
  templateUrl: './category-add.component.html',
  styleUrls: ['./category-add.component.css']
})
export default class CategoryAddComponent {
  category: Category = {
    name: '',
    enabled: true
  };

  constructor(private categoryService: CategoryService, private router: Router) {}

  // ✅ Mensaje de éxito
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

  // ✅ Mensaje de error
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

  async onSubmit() {
    if (!this.category.name.trim()) {
      this.showErrorMessage('Error', 'El nombre de la categoría no puede estar vacío.');
      return;
    }

    try {
      await this.categoryService.addCategory({
        name: this.category.name.trim(),
        enabled: this.category.enabled
      });

      // ✅ Mostrar mensaje de éxito con SweetAlert2
      this.showSuccessMessage('Categoría Agregada', `La categoría "${this.category.name}" fue creada correctamente.`);

      this.router.navigate(['/category']); // Redirigir después de actualizar
      this.resetForm();
    } catch (error) {
      console.error('Error al agregar la categoría:', error);
      this.showErrorMessage('Error en la creación', 'Hubo un problema al agregar la categoría.');
    }
  }

  resetForm() {
    this.category = { name: '', enabled: true };
  }
}
