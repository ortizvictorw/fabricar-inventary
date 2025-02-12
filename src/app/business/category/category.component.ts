import { Component, OnInit, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Category, CategoryService } from '../../services/category.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule], // ✅ Importamos FormsModule
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'],
  animations: [
    trigger('slideInOut', [
      state('open', style({ opacity: 1, transform: 'translateY(0)' })),
      state('closed', style({ opacity: 0, transform: 'translateY(-10px)' })),
      transition('open <=> closed', animate('200ms ease-in-out'))
    ])
  ]
})
export default class CategoryComponent implements OnInit {
  categories$!: Observable<Category[]>;
  filteredCategories: Category[] = [];
  searchQuery: string = '';
  open = false;

  constructor(private categoryService: CategoryService, private router: Router) {}

  ngOnInit() {
    this.categories$ = this.categoryService.getCategories();

    // Aplicar filtro en tiempo real sin afectar la suscripción original
    this.categories$.subscribe(categories => {
      this.filteredCategories = categories;
    });
  }

  applyFilter() {
    this.categories$.subscribe(categories => {
      const query = this.searchQuery.toLowerCase();
      this.filteredCategories = categories.filter(category => 
        category.name.toLowerCase().includes(query)
      );
    });
  }

  toggleOpen() {
    this.open = !this.open;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-content') && !target.closest('button')) {
      this.open = false;
    }
  }

  editCategory(id: string) {
    this.router.navigate(['/category-edit', id]);
  }
}
