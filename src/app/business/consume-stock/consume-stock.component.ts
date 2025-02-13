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
  stockItem: Stock | null = null;
  searchQuery: string = '';
  quantityToConsume: number = 0;

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

  // ✅ Mensaje de advertencia con SweetAlert2
  showWarningMessage(title: string, message: string) {
    Swal.fire({
      title,
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
      this.stockItem = null;
      return;
    }

    this.stockService.getStocks().subscribe(
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

  async onConsumeStock() {
    if (!this.stockItem || this.quantityToConsume <= 0) {
      this.showErrorMessage('Campos inválidos', 'Selecciona un producto y una cantidad válida.');
      return;
    }

    if (this.quantityToConsume > this.stockItem.quantity) {
      this.showWarningMessage('Stock insuficiente', 'No puedes consumir más stock del disponible.');
      return;
    }

    const confirmResult = await Swal.fire({
      title: '¿Confirmar consumo?',
      text: `Se consumirán ${this.quantityToConsume} unidades de "${this.stockItem.name}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, consumir',
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
        quantity: this.stockItem.quantity - this.quantityToConsume
      };

      await this.stockService.updateStock(updatedStock);

      this.showSuccessMessage(
        'Stock consumido',
        `Se consumieron ${this.quantityToConsume} unidades de "${this.stockItem.name}".`
      );

      this.router.navigate(['/stock']);
      this.resetForm();
    } catch (error) {
      console.error('Error al consumir stock:', error);
      this.showErrorMessage('Error en consumo', 'Hubo un problema al consumir el stock.');
    }
  }

  resetForm() {
    this.searchQuery = '';
    this.quantityToConsume = 0;
    this.stockItem = null;
  }
}
