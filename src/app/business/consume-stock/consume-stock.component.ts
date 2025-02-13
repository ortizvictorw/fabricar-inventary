import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StockService, Stock } from '../../services/stock.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-consume-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consume-stock.component.html',
  styleUrls: ['./consume-stock.component.css']
})
export default class ConsumeStockComponent {
  stockItem: Stock = { id: '', name: '', price: 0, quantity: 0, available: false };
  searchQuery: string = '';
  quantityToConsume: number = 0;

  constructor(private stockService: StockService, private router: Router) {}

  // ✅ Mensaje de éxito con SweetAlert2
  showSuccessMessage(title: string, message: string) {
    Swal.fire({
      title: title,
      text: message,
      icon: 'success',
      confirmButtonText: 'OK',
      background: '#1f2937',
      color: '#ffffff',
      confirmButtonColor: '#22C55E', // Verde éxito
      timer: 2500
    });
  }

  // ✅ Mensaje de error con SweetAlert2
  showErrorMessage(title: string, message: string) {
    Swal.fire({
      title: title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      background: '#1f2937',
      color: '#ffffff',
      confirmButtonColor: '#EF4444' // Rojo error
    });
  }

  // ✅ Mensaje de advertencia con SweetAlert2
  showWarningMessage(title: string, message: string) {
    Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      confirmButtonText: 'OK',
      background: '#1f2937',
      color: '#ffffff',
      confirmButtonColor: '#FACC15' // Amarillo advertencia
    });
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.stockItem = { id: '', name: '', price: 0, quantity: 0, available: false };
      return;
    }

    this.stockService.getStocks().subscribe(
      (stocks) => {
        const foundStock = stocks.find((stock) =>
          stock.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
        this.stockItem = foundStock ?? { id: '', name: '', price: 0, quantity: 0, available: false };
      },
      (error) => {
        console.error('Error al buscar el producto:', error);
        this.showErrorMessage('Error de búsqueda', 'Hubo un problema al buscar el producto.');
      }
    );
  }

  async onConsumeStock() {
    if (!this.stockItem.id || this.quantityToConsume <= 0) {
      this.showErrorMessage('Campos inválidos', 'Por favor, selecciona un producto y una cantidad válida.');
      return;
    }

    if (this.quantityToConsume > this.stockItem.quantity) {
      this.showWarningMessage('Stock insuficiente', 'No puedes consumir más stock del disponible.');
      return;
    }

    try {
      const updatedStock = {
        ...this.stockItem,
        quantity: this.stockItem.quantity - this.quantityToConsume
      };

      await this.stockService.updateStock(updatedStock);

      // ✅ Mostrar mensaje de éxito con SweetAlert2
      this.showSuccessMessage(
        'Stock consumido',
        `Se consumieron ${this.quantityToConsume} unidades de "${this.stockItem.name}".`
      );

      this.router.navigate(['/stock']); // Redirigir después de actualizar
      this.resetForm();
    } catch (error) {
      console.error('Error al consumir stock:', error);
      this.showErrorMessage('Error en consumo', 'Hubo un problema al consumir el stock.');
    }
  }

  resetForm() {
    this.searchQuery = '';
    this.quantityToConsume = 0;
    this.stockItem = { id: '', name: '', price: 0, quantity: 0, available: false };
  }
}
