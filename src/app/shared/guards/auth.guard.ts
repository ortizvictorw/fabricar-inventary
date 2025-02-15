import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private restrictedUserId = 'P2tm9OSRp8N9VhJNghPkT9LNjl53'; // ID bloqueado
  private allowedRoutes = ['production', 'production-view'];

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.authService.user$.pipe(
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        // Si el usuario coincide con el ID restringido, solo permitimos ciertas rutas
        const currentRoute = route.routeConfig?.path?.split('/')[0] || '';
        if (user.uid === this.restrictedUserId && !this.allowedRoutes.includes(currentRoute)) {
          this.router.navigate(['/production']); // 🚫 Redirigir a producción
          return false;
        }

        return true; // ✅ Permitir acceso a la ruta
      })
    );
  }
}
