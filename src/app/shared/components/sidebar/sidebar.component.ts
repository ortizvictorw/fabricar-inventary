import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive,]
})
export class SidebarComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']); // Redirigir al login después de cerrar sesión
    }).catch(error => {
      console.error('Error al cerrar sesión:', error);
    });
  }
}
