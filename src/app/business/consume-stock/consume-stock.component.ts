import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StockService, Stock } from '../../services/stock.service';
import { Router } from '@angular/router';

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

  constructor(private stockService: StockService, private router: Router
  ) { }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.stockItem = { id: '', name: '', price: 0, quantity: 0, available: false };
      return;
    }

    this.stockService.getStocks().subscribe(stocks => {
      const foundStock = stocks.find(stock =>
        stock.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
      this.stockItem = foundStock ?? { id: '', name: '', price: 0, quantity: 0, available: false };
    });
  }

  async onConsumeStock() {
    if (!this.stockItem.id || this.quantityToConsume <= 0) {
      alert('Por favor, selecciona un producto y una cantidad válida.');
      return;
    }

    if (this.quantityToConsume > this.stockItem.quantity) {
      alert('No puedes consumir más stock del disponible.');
      return;
    }

    try {
      const updatedStock = {
        ...this.stockItem,
        quantity: this.stockItem.quantity - this.quantityToConsume
      };

      await this.stockService.updateStock(updatedStock);
      alert(`Se consumieron ${this.quantityToConsume} unidades de ${this.stockItem.name}`);
      this.router.navigate(['/stock']); // Redirigir después de actualizar
      this.resetForm();
    } catch (error) {
      console.error('Error al consumir stock:', error);
      alert('Hubo un error al consumir el stock.');
    }
  }

  resetForm() {
    this.searchQuery = '';
    this.quantityToConsume = 0;
    this.stockItem = { id: '', name: '', price: 0, quantity: 0, available: false };
  }
}
