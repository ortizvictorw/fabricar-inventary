import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-category-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // ✅ Usamos ReactiveFormsModule
  templateUrl: './category-add.component.html',
  styleUrls: ['./category-add.component.css']
})
export default class CategoryAddComponent {
  categoryForm: FormGroup;

  constructor(private fb: FormBuilder, private categoryService: CategoryService, private router: Router) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      enabled: [true]
    });
  }

  // ✅ Mostrar alerta de éxito con SweetAlert2
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

  // ✅ Mostrar alerta de error con SweetAlert2
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
    if (this.categoryForm.invalid) {
      this.showErrorMessage('Error', 'El nombre de la categoría no puede estar vacío o menor a 3 caracteres.');
      return;
    }

    try {
      await this.categoryService.addCategory(this.categoryForm.value);
      this.showSuccessMessage('Categoría Agregada', `La categoría "${this.categoryForm.value.name}" fue creada correctamente.`);
      this.router.navigate(['/category']);
      this.categoryForm.reset({ enabled: true });
    } catch (error) {
      console.error('Error al agregar la categoría:', error);
      this.showErrorMessage('Error en la creación', 'Hubo un problema al agregar la categoría.');
    }
  }
}
