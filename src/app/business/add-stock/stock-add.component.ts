import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService, Stock } from '../../services/stock.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-stock-add',
  standalone: true,
  imports: [CommonModule, FormsModule], // ✅ Importando módulos necesarios
  templateUrl: './stock-add.component.html',
  styleUrls: ['./stock-add.component.css']
})
export default class StockAddComponent implements OnDestroy {
  stockItem: Stock | null = null;
  searchQuery: string = '';
  quantityToAdd: number = 0;
  private stockSubscription: Subscription | null = null;

  constructor(private stockService: StockService, private router: Router) {}

  // ✅ Mensaje de error con SweetAlert2
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

  // ✅ Mensaje de éxito con SweetAlert2
  showSuccessMessage(title: string, message: string) {
    Swal.fire({
      title,
      text: message,
      icon: 'success',
      confirmButtonText: 'OK',
      background: '#1f2937',
      color: '#ffffff',
      confirmButtonColor: '#22C55E', // Verde éxito
      timer: 2500
    });
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.stockItem = null;
      return;
    }

    if (this.stockSubscription) {
      this.stockSubscription.unsubscribe();
    }

    this.stockSubscription = this.stockService.getStocks().subscribe(
      (stocks) => {
        const foundStock = stocks.find((stock) =>
          stock.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
        this.stockItem = foundStock || null;
      },
      (error) => {
        console.error('Error al buscar el producto:', error);
        this.showErrorMessage('Error de búsqueda', 'Hubo un problema al buscar el producto.');
      }
    );
  }

  async onAddStock() {
    if (!this.stockItem || this.quantityToAdd <= 0) {
      this.showErrorMessage('Campos inválidos', 'Selecciona un producto y una cantidad válida.');
      return;
    }

    const confirmResult = await Swal.fire({
      title: '¿Confirmar ingreso?',
      text: `Se agregarán ${this.quantityToAdd} unidades a "${this.stockItem.name}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, agregar',
      cancelButtonText: 'Cancelar',
      background: '#1f2937',
      color: '#ffffff',
      confirmButtonColor: '#22C55E',
      cancelButtonColor: '#EF4444'
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      const updatedStock = {
        ...this.stockItem,
        quantity: this.stockItem.quantity + this.quantityToAdd
      };

      await this.stockService.updateStock(updatedStock);

      this.showSuccessMessage(
        'Stock actualizado',
        `Se agregaron ${this.quantityToAdd} unidades a "${this.stockItem.name}".`
      );

      this.router.navigate(['/stock']);
      this.resetForm();
    } catch (error) {
      console.error('Error al actualizar el stock:', error);
      this.showErrorMessage('Error en actualización', 'Hubo un problema al actualizar el stock.');
    }
  }

  resetForm() {
    this.searchQuery = '';
    this.quantityToAdd = 0;
    this.stockItem = null;
  }

  ngOnDestroy() {
    if (this.stockSubscription) {
      this.stockSubscription.unsubscribe();
    }
  }
}
