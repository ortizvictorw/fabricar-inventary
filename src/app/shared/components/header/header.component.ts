import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Location, CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { SubscriptionService } from '../../../services/suscription.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive], // 
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  showBackButton: boolean = false;
  isMenuOpen: boolean = false;
  remainingDays: number = 0;

  private routesWithBackButton = [
    'product-add',
    'product-edit',
    'consume-stock',
    'add-stock',
    'update-prices',
    'category-add',
    'budget-add'
  ];

  constructor(
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.updateBackButtonVisibility();
    });

    this.subscriptionService.getRemainingDays().subscribe(days => {
      this.remainingDays = days;
      console.log('Días restantes:', this.remainingDays);
      if(this.remainingDays <= 0) {
        this.subscriptionService.checkAndNotifyIfExpired();
      }
    });
    
  }

  updateBackButtonVisibility(): void {
    const currentRoute = this.router.url.split('?')[0];
    this.showBackButton = this.routesWithBackButton.some(route => currentRoute.includes(route));
  }

  goBack(): void {
    this.location.back();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    }).catch(error => {
      console.error('Error al cerrar sesión:', error);
    });
  }
}
