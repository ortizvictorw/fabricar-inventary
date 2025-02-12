import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, Category } from '../../services/category.service';
import { Router } from '@angular/router';


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


  constructor(private categoryService: CategoryService, private router: Router) { }

  async onSubmit() {
    if (!this.category.name.trim()) {
      alert('El nombre de la categoría no puede estar vacío.');
      return;
    }

    try {
      await this.categoryService.addCategory({ name: this.category.name.trim(), enabled: this.category.enabled });
      this.router.navigate(['/category']); // Redirigir después de actualizar
      alert(`Categoría "${this.category.name}" agregada correctamente.`);

      this.resetForm();
    } catch (error) {
      console.error('Error al agregar la categoría:', error);
      alert('Hubo un error al agregar la categoría.');
    }
  }

  resetForm() {
    this.category = { name: '', enabled: true };
  }
}
