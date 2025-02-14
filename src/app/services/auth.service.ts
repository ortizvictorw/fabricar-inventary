import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, user, User, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments.prod';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null>;

  constructor(private auth: Auth, private router: Router) {
    this.user$ = user(this.auth);
  }

  async loginWithEmail(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      alert('Correo o contraseña incorrectos.');
    }
  }

  async register(email: string, password: string): Promise<void> {
    try {
      await createUserWithEmailAndPassword(this.auth, email, password);
      this.router.navigate(['/stock']); // 🔄 Redirigir tras registro exitoso
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      alert('Error al registrar usuario.');
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      
      // Correo permitido
      const userEmail = result.user.email;
  
      if (!environment.whitelist.includes(userEmail!)) {
        await this.logout(); // ❌ Cerrar sesión si el correo no está en la lista
        alert("Acceso denegado. Solo usuarios autorizados pueden iniciar sesión.");
        return;
      }
  
      this.router.navigate(['/stock']); // ✅ Redirigir tras login exitoso
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('Hubo un error al iniciar sesión con Google.');
    }
  }
  

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']); // 🔄 Redirigir tras logout
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
