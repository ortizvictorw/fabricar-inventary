import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Location, CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive], // ✅ Importamos módulos requeridos
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  breadcrumbs: Breadcrumb[] = [];
  showBackButton: boolean = false; // Estado para mostrar u ocultar el botón "Atrás"
  isMenuOpen: boolean = false; // Estado para mostrar u ocultar el menú hamburguesa

  private routesWithBackButton = [
    'product-add',
    'product-edit',
    'consume-stock',
    'add-stock',
    'update-prices',
    'category-add',
    'budget-add'
  ]; // Lista de rutas donde se mostrará el botón "Atrás"

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute, private location: Location) {}

  ngOnInit(): void {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.breadcrumbs = this.createBreadcrumbs(this.route.root);
      this.updateBackButtonVisibility(); // Verificar si el botón debe mostrarse
    });
  }

  createBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      breadcrumbs.push({ label: child.snapshot.data['title'] || routeURL, url });

      return this.createBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  updateBackButtonVisibility(): void {
    const currentRoute = this.router.url.split('?')[0]; // Obtener la URL sin query params
    this.showBackButton = this.routesWithBackButton.some(route => currentRoute.includes(route));
  }

  goBack(): void {
    this.location.back();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']); // Redirigir al login después de cerrar sesión
    }).catch(error => {
      console.error('Error al cerrar sesión:', error);
    });
  }
}
