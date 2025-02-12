import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService, Stock } from '../../services/stock.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-stock-add',
  standalone: true,
  imports: [CommonModule, FormsModule], // ✅ Importando módulos necesarios
  templateUrl: './stock-add.component.html',
  styleUrls: ['./stock-add.component.css']
})
export default class StockAddComponent implements OnDestroy {
  stockItem: Stock = { id: '', name: '', price: 0, quantity: 0, available: false };
  searchQuery: string = '';
  quantityToAdd: number = 0;
  private stockSubscription: Subscription | null = null;

  constructor(private stockService: StockService, private router: Router
  ) { }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.stockItem = { id: '', name: '', price: 0, quantity: 0, available: false };
      return;
    }

    // Cancelamos la suscripción anterior antes de crear una nueva
    if (this.stockSubscription) {
      this.stockSubscription.unsubscribe();
    }

    this.stockSubscription = this.stockService.getStocks().subscribe(stocks => {
      const foundStock = stocks.find(stock =>
        stock.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
      this.stockItem = foundStock ?? { id: '', name: '', price: 0, quantity: 0, available: false };
    }, error => {
      console.error('Error al buscar el producto:', error);
    });
  }

  async onAddStock() {
    if (!this.stockItem.id || this.quantityToAdd <= 0) {
      alert('Por favor, selecciona un producto y una cantidad válida.');
      return;
    }

    try {
      const updatedStock = {
        ...this.stockItem,
        quantity: this.stockItem.quantity + this.quantityToAdd
      };

      await this.stockService.updateStock(updatedStock);
      alert(`Se agregaron ${this.quantityToAdd} unidades a ${this.stockItem.name}`);
      this.router.navigate(['/stock']); // Redirigir después de actualizar
      this.resetForm();
    } catch (error) {
      console.error('Error al actualizar el stock:', error);
      alert('Hubo un error al actualizar el stock.');
    }
  }

  resetForm() {
    this.searchQuery = '';
    this.quantityToAdd = 0;
    this.stockItem = { id: '', name: '', price: 0, quantity: 0, available: false };
  }

  ngOnDestroy() {
    // Limpiar la suscripción al destruir el componente
    if (this.stockSubscription) {
      this.stockSubscription.unsubscribe();
    }
  }
}
