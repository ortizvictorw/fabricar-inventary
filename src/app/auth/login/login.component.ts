import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { SubscriptionService } from '../../services/suscription.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export default class LoginComponent {
  loginForm: FormGroup;
  showPassword: boolean = false;

  constructor(private authService: AuthService, private fb: FormBuilder, private subscriptionService: SubscriptionService, private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  showSuccessMessage() {
    Swal.fire({
      title: '¡Inicio de sesión exitoso!',
      text: 'Bienvenido al sistema de gestión de stock',
      icon: 'success',
      confirmButtonText: 'Continuar',
      background: '#1f2937',
      color: '#ffffff',
      confirmButtonColor: '#6366F1',
      timer: 2500
    });
  }

  showErrorMessage() {
    Swal.fire({
      title: '¡Error!',
      text: 'Credenciales incorrectas, intenta de nuevo',
      icon: 'error',
      confirmButtonText: 'Aceptar',
      background: '#1f2937',
      color: '#ffffff',
      confirmButtonColor: '#EF4444'
    });
  }

  login() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.loginWithEmail(email, password);
      this.subscriptionService.getRemainingDays().subscribe(days => {
        console.log('Días restantes:', days);
        if (days <= 0) {
          this.subscriptionService.checkAndNotifyIfExpired();
        } else {
          this.showSuccessMessage();
          this.router.navigate(['/stock']); // 🔄 Redirigir tras login
        }
      });

    } else {
      this.showErrorMessage();
    }
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }
}
