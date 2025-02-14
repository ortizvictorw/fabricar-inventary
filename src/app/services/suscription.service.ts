import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private collectionName = 'suscription'; // 🔹 Nombre de la colección en Firestore

  constructor(private firestore: Firestore, private authService: AuthService) {}

  /**
   * Obtiene directamente los días restantes antes de que la suscripción expire.
   */
  getRemainingDays(): Observable<number> {
    const suscriptionCollection = collection(this.firestore, this.collectionName);

    return from(getDocs(suscriptionCollection)).pipe(
      map(snapshot => {
        if (snapshot.empty) {
          console.warn('No se encontró ningún documento en la colección suscription.');
          return 0;
        }

        const firstDoc = snapshot.docs[0]; // Obtener el primer documento
        const data = firstDoc.data();

        if (!data || !data['expirationDate']) {
          console.warn('El documento no contiene expirationDate.');
          return 0;
        }

        // Convertir a Date si es un Timestamp de Firestore
        const expirationDate = data['expirationDate'].toDate ? data['expirationDate'].toDate() : new Date(data['expirationDate']);
        const today = new Date();

        // Calcular diferencia en días
        const diffTime = expirationDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
      }),
      catchError(error => {
        console.error('Error al obtener días restantes:', error);
        return of(0);
      })
    );
  }

  /**
   * Verifica si la suscripción está vencida, limpia el usuario del localStorage y muestra una alerta con SweetAlert2.
   */
  checkAndNotifyIfExpired(): void {
    this.getRemainingDays().subscribe(days => {
      if (days <= 0) {
        console.warn('La suscripción ha vencido. Eliminando usuario del localStorage...');
        localStorage.removeItem('user'); // 🔹 Limpia el usuario en localStorage

        // 🔹 Mostrar alerta con SweetAlert2
        Swal.fire({
          icon: 'warning',
          title: 'Suscripción Expirada',
          text: 'Tu suscripción ha expirado. Comunícate con soporte técnico para reactivarla luego de brindar comprobante de pago.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3085d6'
        });
      }
      this.authService.logout(); // 🔹 Cerrar sesión automáticamente
    });
  }
}
